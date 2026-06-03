import { useEffect } from 'react';
import { getSocket } from '../api/socket';

export function useMapSocket({
  onReportNew,
  onReportStatusUpdated,
  onAlertNew,
  onAlertResolved,
  onDeviceSeen,
} = {}) {
  useEffect(() => {
    const socket = getSocket();

    const handlers = {
      'map:report_new':            onReportNew,
      'map:report_status_updated': onReportStatusUpdated,
      'map:alert_new':             onAlertNew,
      'map:alert_resolved':        onAlertResolved,
      'map:device_seen':           onDeviceSeen,
    };

    Object.entries(handlers).forEach(([event, fn]) => {
      if (typeof fn === 'function') socket.on(event, fn);
    });

    return () => {
      Object.entries(handlers).forEach(([event, fn]) => {
        if (typeof fn === 'function') socket.off(event, fn);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onReportNew, onReportStatusUpdated, onAlertNew, onAlertResolved, onDeviceSeen]);
}