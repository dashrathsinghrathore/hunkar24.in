import React from 'react';
import { Activity, Clock, Shield, Search } from 'lucide-react';
import { useNews } from '../../context/NewsContext';

export const ActivityLogsView: React.FC = () => {
  const { auditLogs } = useNews();

  return (
    <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 p-5 sm:p-7 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200 dark:border-stone-800">
        <div>
          <h2 className="text-xl font-black font-newspaper-headline text-stone-900 dark:text-stone-100 flex items-center gap-2">
            <Activity className="w-5 h-5 text-red-600" />
            <span>ऑडिट लॉग्स एवं संपादकीय कार्यवाहियां (Audit Trail)</span>
          </h2>
          <p className="text-xs text-stone-500">
            हुंकार 24 एडमिन पैनल पर किए गए प्रत्येक संपादन, प्रकाशन व अनुमोदन का रिकॉर्ड
          </p>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-stone-200 dark:border-stone-800">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-stone-50 dark:bg-stone-800/80 border-b border-stone-200 dark:border-stone-800 font-bold">
              <th className="p-3">समय (Timestamp)</th>
              <th className="p-3">उपयोगकर्ता (User)</th>
              <th className="p-3">मॉड्यूल (Module)</th>
              <th className="p-3">कार्यवाही (Action)</th>
              <th className="p-3">विवरण (Details)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 dark:divide-stone-800 font-sans">
            {auditLogs.map(log => (
              <tr key={log.id} className="hover:bg-stone-50/50 dark:hover:bg-stone-800/40">
                <td className="p-3 whitespace-nowrap font-mono text-stone-500 text-[11px]">
                  {log?.timestamp ? new Date(log.timestamp).toLocaleString('hi-IN') : 'हाल ही में'}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="font-bold block text-stone-900 dark:text-stone-100">{log.userName}</span>
                  <span className="text-[10px] text-amber-600 font-mono">{log.userRole}</span>
                </td>
                <td className="p-3 whitespace-nowrap font-medium text-stone-600 dark:text-stone-300">
                  {log.module}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300">
                    {log.action}
                  </span>
                </td>
                <td className="p-3 text-stone-700 dark:text-stone-300 max-w-md">
                  {log.details}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
