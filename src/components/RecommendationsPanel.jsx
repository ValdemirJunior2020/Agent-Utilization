// /src/components/RecommendationsPanel.jsx
import { Lightbulb } from 'lucide-react';

export default function RecommendationsPanel({ recommendations }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {recommendations.map((item, index) => (
        <div key={`${item.title}-${index}`} className="rounded-3xl border border-sky-100 bg-sky-50/70 p-4">
          <div className="flex gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-white text-hpBlue"><Lightbulb size={20} /></div>
            <div>
              <h3 className="font-black text-hpNavy">{item.title}</h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">{item.detail}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
