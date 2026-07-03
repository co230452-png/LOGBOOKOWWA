import React, { useEffect, useRef, useState } from 'react';
import { Html5QrcodeScanner, Html5QrcodeScanType } from 'html5-qrcode';
import { CheckCircle, XCircle, AlertTriangle, QrCode, RefreshCw, User } from 'lucide-react';
import { attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

type ScanStatus = 'idle' | 'success' | 'duplicate' | 'error';

interface ScanResult {
  status: ScanStatus;
  message: string;
  userName?: string;
  time?: string;
}

// Below this width we treat the layout as "mobile"; above it, "desktop".
// We only ever restart the camera when you cross this line, not on
// every pixel of a drag — that's what was causing repeated permission
// prompts.
const BREAKPOINT_PX = 1024;

const QRScannerPage: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivId = 'qr-reader';
  const isProcessingRef = useRef(false);

  const scanningRef = useRef(false);
  const isMobileRef = useRef(
    typeof window !== 'undefined' ? window.innerWidth < BREAKPOINT_PX : false
  );

  useEffect(() => {
    scanningRef.current = scanning;
  }, [scanning]);

  useEffect(() => {
    return () => {
      // Cleanup scanner on unmount
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
      }
    };
  }, []);

  // Only restart the camera when the layout actually crosses the
  // mobile/desktop breakpoint (e.g. rotating a tablet, or resizing a
  // desktop window past the sidebar collapse point) — NOT on every
  // resize tick. This avoids repeated getUserMedia calls, which is
  // what triggers the browser's permission prompt.
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${BREAKPOINT_PX}px)`);

    const handleChange = async () => {
      const nowMobile = !mql.matches;
      if (nowMobile === isMobileRef.current) return; // didn't actually cross the line
      isMobileRef.current = nowMobile;

      if (!scanningRef.current) return;

      if (scannerRef.current) {
        try {
          await scannerRef.current.clear();
        } catch {}
        scannerRef.current = null;
      }
      startScanner();
    };

    mql.addEventListener('change', handleChange);
    return () => mql.removeEventListener('change', handleChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startScanner = () => {
    setScanResult(null);
    setScanning(true);
    isProcessingRef.current = false;

    setTimeout(() => {
      try {
        scannerRef.current = new Html5QrcodeScanner(
          scannerDivId,
          {
            fps: 10,
            // Percentage-based box instead of a fixed {250,250} square.
            // A fixed pixel box can end up larger than the rendered
            // video on some layouts, which is part of what made it
            // look off-center. This keeps it centered and proportional
            // no matter what size the video actually renders at.
            qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
              const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
              const size = Math.floor(minEdge * 0.7);
              return { width: size, height: size };
            },
            supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
            rememberLastUsedCamera: true,
            // No forced `aspectRatio` here — letting the library use the
            // camera's native aspect ratio avoids the cropping/box-offset
            // mismatch that a forced 1:1 ratio was causing.
          },
          false // verbose = false
        );

        scannerRef.current.render(
          async (decodedText) => {
            // Prevent multiple rapid scans
            if (isProcessingRef.current) return;
            isProcessingRef.current = true;

            try {
              const parsed = JSON.parse(decodedText);
              const userId = parsed.userId || decodedText;

              const { data } = await attendanceAPI.log(userId);

              const result: ScanResult = {
                status: 'success',
                message: data.message,
                userName: `${data.user?.firstName} ${data.user?.lastName}`,
                time: format(new Date(), 'h:mm:ss a'),
              };

              setScanResult(result);
              setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

              // Pause scanner briefly, then re-enable
              setTimeout(() => {
                isProcessingRef.current = false;
              }, 3000);
            } catch (err: any) {
              const apiErr = err.response?.data;
              let status: ScanStatus = 'error';
              let message = apiErr?.message || 'Failed to log attendance';

              if (err.response?.status === 409 || apiErr?.alreadyLogged) {
                status = 'duplicate';
                message = apiErr?.message || 'Already logged today';
              }

              const result: ScanResult = {
                status,
                message,
                userName: apiErr?.user
                  ? `${apiErr.user.firstName} ${apiErr.user.lastName}`
                  : undefined,
                time: format(new Date(), 'h:mm:ss a'),
              };

              setScanResult(result);
              setRecentScans((prev) => [result, ...prev.slice(0, 9)]);

              setTimeout(() => {
                isProcessingRef.current = false;
              }, 2000);
            }
          },
          (error) => {
            // QR scan error (camera can't read) - silent
          }
        );
      } catch (e) {
        setScanning(false);
        setScanResult({ status: 'error', message: 'Failed to start camera. Check permissions.' });
      }
    }, 100);
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.clear();
      } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const StatusIcon = ({ status }: { status: ScanStatus }) => {
    if (status === 'success') return <CheckCircle className="w-8 h-8 text-green-500" />;
    if (status === 'duplicate') return <AlertTriangle className="w-8 h-8 text-yellow-500" />;
    return <XCircle className="w-8 h-8 text-red-500" />;
  };

  const statusClasses = {
    success: 'bg-green-50 border-green-200 text-green-800',
    duplicate: 'bg-yellow-50 border-yellow-200 text-yellow-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    idle: '',
  };

  return (
    <AdminLayout>
      {/*
        Scoped CSS: only pin the video's WIDTH to 100%. Height is left
        as `auto` so the browser scales it by its natural aspect ratio
        instead of stretching/cropping it — that mismatch (forcing both
        width and height, or cropping with object-fit) is what was
        pushing the scan box out of alignment with the visible video.
      */}
      <style>{`
        #qr-reader {
          width: 100% !important;
        }
        #qr-reader video {
          width: 100% !important;
          height: auto !important;
          display: block !important;
        }
        #qr-reader__dashboard {
          padding: 8px !important;
        }
        #qr-reader__dashboard_section_csr button {
          border-radius: 8px !important;
        }
      `}</style>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan member QR codes to log attendance — {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Scanner Panel */}
        <div className="lg:col-span-3">
          <div className="card">
            {/* Scanner Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${scanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {scanning ? 'Scanner Active' : 'Scanner Inactive'}
                </span>
              </div>
              <div className="flex gap-2">
                {!scanning ? (
                  <button onClick={startScanner} className="btn-primary flex items-center gap-2">
                    <QrCode className="w-4 h-4" />
                    Start Scanner
                  </button>
                ) : (
                  <button onClick={stopScanner} className="btn-danger flex items-center gap-2">
                    <XCircle className="w-4 h-4" />
                    Stop
                  </button>
                )}
              </div>
            </div>

            {/*
              No fixed aspect-ratio + overflow-hidden here on purpose:
              Html5QrcodeScanner renders its own control bar (camera
              picker, torch button, links) above/below the video inside
              this same box. A fixed-height clipped container was
              cutting that combined content off at the bottom, which is
              what made the scan box look shifted down/cropped. Letting
              height grow naturally (min-height only) fixes that.
            */}
            <div className="bg-gray-900 rounded-xl overflow-visible min-h-[320px] flex items-center justify-center relative">
              {!scanning && (
                <div className="text-center text-gray-400 p-8">
                  <QrCode className="w-16 h-16 mx-auto mb-4 opacity-30" />
                  <p className="font-medium text-gray-300">Camera is off</p>
                  <p className="text-sm text-gray-500 mt-2">Click "Start Scanner" to activate camera</p>
                </div>
              )}
              <div
                id={scannerDivId}
                className={`w-full ${scanning ? '' : 'hidden'}`}
                style={{ background: 'transparent' }}
              />
            </div>

            {/* Scan Result */}
            {scanResult && (
              <div className={`mt-4 p-4 rounded-xl border-2 ${statusClasses[scanResult.status]} flex items-start gap-3 animate-slide-up`}>
                <StatusIcon status={scanResult.status} />
                <div>
                  {scanResult.userName && (
                    <div className="flex items-center gap-1.5 font-bold text-lg mb-0.5">
                      <User className="w-4 h-4" />
                      {scanResult.userName}
                    </div>
                  )}
                  <p className="font-medium">{scanResult.message}</p>
                  {scanResult.time && (
                    <p className="text-xs opacity-70 mt-1">Scanned at {scanResult.time}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">📋 Scanning Tips:</p>
              <p>• Hold the QR code steady within the frame</p>
              <p>• Ensure good lighting for best results</p>
              <p>• Each member can only be logged once per day</p>
            </div>
          </div>
        </div>

        {/* Recent Scans */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Scans</h2>
              {recentScans.length > 0 && (
                <button
                  onClick={() => setRecentScans([])}
                  className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  Clear
                </button>
              )}
            </div>

            {recentScans.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scans yet this session</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto scrollbar-thin">
                {recentScans.map((scan, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-sm ${
                      scan.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : scan.status === 'duplicate'
                        ? 'border-yellow-200 bg-yellow-50'
                        : 'border-red-200 bg-red-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800">
                        {scan.userName || 'Unknown'}
                      </span>
                      <span className="text-xs text-gray-400">{scan.time}</span>
                    </div>
                    <p className={`text-xs ${
                      scan.status === 'success' ? 'text-green-700' :
                      scan.status === 'duplicate' ? 'text-yellow-700' : 'text-red-700'
                    }`}>
                      {scan.status === 'success' ? '✓' : scan.status === 'duplicate' ? '⚠' : '✗'} {scan.message}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default QRScannerPage;
