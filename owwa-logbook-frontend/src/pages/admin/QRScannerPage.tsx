import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { CheckCircle, XCircle, AlertTriangle, QrCode, RefreshCw, User, Clock } from 'lucide-react';
import { attendanceAPI } from '../../utils/api';
import AdminLayout from '../../components/admin/AdminLayout';
import { format } from 'date-fns';

type ScanStatus = 'idle' | 'success' | 'duplicate' | 'full' | 'error';

interface ScanResult {
  status: ScanStatus;
  message: string;
  userName?: string;
  slot?: string;
  time?: string;
  summary?: {
    morningIn: string; morningOut: string;
    afternoonIn: string; afternoonOut: string;
    totalFormatted: string;
  };
}

const SCANNER_ID = 'owwa-qr-video';

const slotColors: Record<string, string> = {
  morningIn:    'bg-blue-600',
  morningOut:   'bg-blue-400',
  afternoonIn:  'bg-orange-500',
  afternoonOut: 'bg-orange-400',
};

const slotLabel: Record<string, string> = {
  morningIn: 'Morning In', morningOut: 'Morning Out',
  afternoonIn: 'Afternoon In', afternoonOut: 'Afternoon Out',
};

const QRScannerPage: React.FC = () => {
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanning, setScanning]     = useState(false);
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);
  const [cameraError, setCameraError] = useState('');

  const qrRef         = useRef<Html5Qrcode | null>(null);
  const isProcessing  = useRef(false);
  const containerRef  = useRef<HTMLDivElement>(null);

  useEffect(() => () => { stopCamera(); }, []);

  const stopCamera = async () => {
    if (qrRef.current) {
      try {
        const s = qrRef.current.getState();
        if (s === 2 || s === 3) await qrRef.current.stop();
        qrRef.current.clear();
      } catch (_) {}
      qrRef.current = null;
    }
  };

  const handleScanSuccess = async (raw: string) => {
    if (isProcessing.current) return;
    isProcessing.current = true;

    try {
      let userId = raw;
      try { const p = JSON.parse(raw); userId = p.userId || raw; } catch (_) {}

      const { data } = await attendanceAPI.log(userId);

      const result: ScanResult = {
        status: 'success',
        message: data.message,
        userName: `${data.user?.firstName} ${data.user?.lastName}`,
        slot: data.slot,
        time: format(new Date(), 'h:mm:ss a'),
        summary: data.summary,
      };
      setScanResult(result);
      setRecentScans(p => [result, ...p.slice(0, 14)]);
      setTimeout(() => { isProcessing.current = false; }, 3000);
    } catch (err: any) {
      const apiErr = err.response?.data;
      const status: ScanStatus =
        err.response?.status === 409 && apiErr?.allFilled ? 'full' :
        err.response?.status === 409 ? 'duplicate' : 'error';

      const result: ScanResult = {
        status,
        message: apiErr?.message || 'Failed to log attendance',
        userName: apiErr?.user ? `${apiErr.user.firstName} ${apiErr.user.lastName}` : undefined,
        time: format(new Date(), 'h:mm:ss a'),
      };
      setScanResult(result);
      setRecentScans(p => [result, ...p.slice(0, 14)]);
      setTimeout(() => { isProcessing.current = false; }, 2000);
    }
  };

  const startScanner = useCallback(async () => {
    setCameraError('');
    setScanResult(null);
    isProcessing.current = false;

    // Read container width BEFORE starting so the library gets a stable number
    const w = containerRef.current?.offsetWidth || 380;
    const qrbox = Math.min(Math.floor(w * 0.6), 260);

    await stopCamera();
    try {
      const qr = new Html5Qrcode(SCANNER_ID, { verbose: false });
      qrRef.current = qr;
      await qr.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: qrbox, height: qrbox }, aspectRatio: 1.333, disableFlip: false },
        handleScanSuccess,
        () => {}
      );
      setScanning(true);
    } catch (err: any) {
      setCameraError(
        (err?.message || '').toLowerCase().includes('permission')
          ? 'Camera permission denied. Please allow camera access and try again.'
          : 'Could not start camera. Make sure no other app is using it.'
      );
      setScanning(false);
      qrRef.current = null;
    }
  }, []);

  const stopScanner = useCallback(async () => {
    await stopCamera();
    setScanning(false);
  }, []);

  const statusStyle: Record<ScanStatus, string> = {
    success:   'border-green-300  bg-green-50  text-green-800',
    duplicate: 'border-yellow-300 bg-yellow-50 text-yellow-800',
    full:      'border-purple-300 bg-purple-50 text-purple-800',
    error:     'border-red-300    bg-red-50    text-red-800',
    idle:      '',
  };

  const StatusIcon = ({ status }: { status: ScanStatus }) => {
    if (status === 'success')   return <CheckCircle   className="w-7 h-7 text-green-500  flex-shrink-0" />;
    if (status === 'duplicate') return <AlertTriangle className="w-7 h-7 text-yellow-500 flex-shrink-0" />;
    if (status === 'full')      return <AlertTriangle className="w-7 h-7 text-purple-500 flex-shrink-0" />;
    return                             <XCircle       className="w-7 h-7 text-red-500    flex-shrink-0" />;
  };

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">QR Code Scanner</h1>
        <p className="text-gray-500 text-sm mt-1">
          Scan to log Morning In / Morning Out / Afternoon In / Afternoon Out — {format(new Date(), 'MMMM d, yyyy')}
        </p>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 mb-5">
        {Object.entries(slotLabel).map(([key, lbl]) => (
          <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold text-white ${slotColors[key]}`}>
            <Clock className="w-3 h-3" /> {lbl}
          </span>
        ))}
      </div>

      <div className="flex flex-col xl:flex-row gap-6">

        {/* ── Camera card ───────────────────────────────────── */}
        <div className="flex-1 min-w-0">
          <div className="card">
            {/* Controls */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${scanning ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`} />
                <span className="text-sm font-medium text-gray-700">
                  {scanning ? 'Scanner Active' : 'Scanner Inactive'}
                </span>
              </div>
              {!scanning ? (
                <button onClick={startScanner} className="btn-primary flex items-center gap-2">
                  <QrCode className="w-4 h-4" /> Start Scanner
                </button>
              ) : (
                <button onClick={stopScanner} className="btn-danger flex items-center gap-2">
                  <XCircle className="w-4 h-4" /> Stop
                </button>
              )}
            </div>

            {/* Viewport — fixed container; html5-qrcode reads offsetWidth once at start */}
            <div
              ref={containerRef}
              className="w-full rounded-xl overflow-hidden bg-gray-900"
              style={{ minHeight: 300 }}
            >
              {!scanning && !cameraError && (
                <div className="flex flex-col items-center justify-center h-72 text-gray-400">
                  <QrCode className="w-16 h-16 mb-4 opacity-25" />
                  <p className="font-medium text-gray-300">Camera is off</p>
                  <p className="text-sm text-gray-500 mt-1">Click "Start Scanner" to activate</p>
                </div>
              )}
              {cameraError && (
                <div className="flex flex-col items-center justify-center h-72 px-6 text-center">
                  <XCircle className="w-12 h-12 text-red-400 mb-3" />
                  <p className="text-red-300 font-medium text-sm">{cameraError}</p>
                  <button onClick={startScanner} className="mt-4 btn-primary text-sm">Try Again</button>
                </div>
              )}
              {/*
                Always in DOM so the element exists when html5-qrcode mounts.
                Hidden via visibility/height instead of display:none to preserve width.
              */}
              <div
                id={SCANNER_ID}
                style={{
                  visibility: scanning ? 'visible' : 'hidden',
                  height:     scanning ? 'auto'    : '0px',
                  overflow:   'hidden',
                }}
              />
            </div>

            {/* Scan result */}
            {scanResult && (
              <div className={`mt-4 p-4 rounded-xl border-2 flex items-start gap-3 animate-slide-up ${statusStyle[scanResult.status]}`}>
                <StatusIcon status={scanResult.status} />
                <div className="min-w-0 flex-1">
                  {scanResult.userName && (
                    <div className="flex items-center gap-1.5 font-bold text-base mb-1 truncate">
                      <User className="w-4 h-4 flex-shrink-0" /> {scanResult.userName}
                    </div>
                  )}
                  {scanResult.slot && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold text-white mb-1 ${slotColors[scanResult.slot]}`}>
                      {slotLabel[scanResult.slot]}
                    </span>
                  )}
                  <p className="font-medium text-sm">{scanResult.message}</p>

                  {/* Day summary grid */}
                  {scanResult.summary && (
                    <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-xs border-t border-current/20 pt-2 opacity-80">
                      <span>🌅 Morning In:    <strong>{scanResult.summary.morningIn}</strong></span>
                      <span>🌅 Morning Out:   <strong>{scanResult.summary.morningOut}</strong></span>
                      <span>🌇 Afternoon In:  <strong>{scanResult.summary.afternoonIn}</strong></span>
                      <span>🌇 Afternoon Out: <strong>{scanResult.summary.afternoonOut}</strong></span>
                      <span className="col-span-2">⏱ Total: <strong>{scanResult.summary.totalFormatted}</strong></span>
                    </div>
                  )}
                  {scanResult.time && (
                    <p className="text-xs opacity-50 mt-1">Scanned at {scanResult.time}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tips */}
            <div className="mt-4 bg-blue-50 rounded-lg p-3 text-xs text-blue-700 space-y-1">
              <p className="font-semibold">📋 How scanning works:</p>
              <p>• Each scan fills the next empty slot in order: Morning In → Morning Out → Afternoon In → Afternoon Out</p>
              <p>• Hold the QR code steady within the frame in good lighting</p>
              <p>• On mobile, the back camera gives best results</p>
            </div>
          </div>
        </div>

        {/* ── Recent Scans ──────────────────────────────────── */}
        <div className="xl:w-80 flex-shrink-0">
          <div className="card h-full">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-800">Recent Scans</h2>
              {recentScans.length > 0 && (
                <button onClick={() => setRecentScans([])} className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Clear
                </button>
              )}
            </div>

            {recentScans.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <QrCode className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No scans yet this session</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
                {recentScans.map((scan, idx) => (
                  <div key={idx} className={`p-3 rounded-lg border text-sm ${
                    scan.status === 'success'   ? 'border-green-200  bg-green-50'  :
                    scan.status === 'duplicate' ? 'border-yellow-200 bg-yellow-50' :
                    scan.status === 'full'      ? 'border-purple-200 bg-purple-50' :
                                                  'border-red-200    bg-red-50'
                  }`}>
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-gray-800 truncate">{scan.userName || 'Unknown'}</span>
                      <span className="text-xs text-gray-400 flex-shrink-0">{scan.time}</span>
                    </div>
                    {scan.slot && (
                      <span className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold text-white mb-1 ${slotColors[scan.slot]}`}>
                        {slotLabel[scan.slot]}
                      </span>
                    )}
                    <p className={`text-xs ${
                      scan.status === 'success'   ? 'text-green-700'  :
                      scan.status === 'duplicate' ? 'text-yellow-700' :
                      scan.status === 'full'      ? 'text-purple-700' : 'text-red-700'
                    }`}>
                      {scan.status === 'success' ? '✓' : '⚠'} {scan.message}
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
