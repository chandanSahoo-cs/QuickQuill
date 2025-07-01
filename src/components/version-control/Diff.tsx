import { GitCompareIcon } from "lucide-react";

export const Diff = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-white/40 backdrop-blur-sm">
      <div className="text-center">
        <GitCompareIcon className="h-12 w-12 mx-auto mb-4 text-slate-400" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Diff View</h3>
        <p className="text-slate-500 max-w-sm">
          Compare changes between different versions of your document. This
          feature will be available soon.
        </p>
      </div>
    </div>
  );
};
