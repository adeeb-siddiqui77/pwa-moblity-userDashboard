import { useState } from "react";

export default function MultiStepMessage({ meta, onSubmit }) {
    const [selectedData, setSelectedData] = useState({});

    console.log("meta" , meta)
  
    function toggle(serviceName, key, value) {
      setSelectedData(prev => {
        const current = prev[serviceName]?.[key] || [];
  
        const updated =
          current.includes(value)
            ? current.filter(v => v !== value)
            : [...current, value];
  
        return {
          ...prev,
          [serviceName]: {
            ...prev[serviceName],
            [key]: updated
          }
        };
      });
    }
  
    return (
      <div className="bg-white p-3 border rounded-xl mt-2 shadow-sm">
        <div className="text-sm font-semibold mb-2">Select Tyre Options</div>
  
        {meta.service.map((srv, sidx) => (
          <div key={sidx} className="mb-4">
            <div className="font-medium text-sm mb-1">
              {srv.name} ({srv.issue})
            </div>
  
            <div className="ml-3 space-y-2">
  
              {/* Tyre Types */}
              <div>
                <div className="text-xs font-semibold mb-1">Tyre Type</div>
                {srv.tyreTypes.map(t => (
                  <label key={t} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedData[srv.name]?.tyreTypes || []).includes(t)}
                      onChange={() => toggle(srv.name, 'tyreTypes', t)}
                    />
                    <span className="text-sm">{t || "(empty)"}</span>
                  </label>
                ))}
              </div>
  
              {/* Approach */}
              <div>
                <div className="text-xs font-semibold mb-1">Approach</div>
                {srv.approach.map(a => (
                  <label key={a} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedData[srv.name]?.approach || []).includes(a)}
                      onChange={() => toggle(srv.name, 'approach', a)}
                    />
                    <span className="text-sm">{a || "(empty)"}</span>
                  </label>
                ))}
              </div>
  
              {/* Patch */}
              <div>
                <div className="text-xs font-semibold mb-1">Patch</div>
                {srv.patch.map(p => (
                  <label key={p} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedData[srv.name]?.patch || []).includes(p)}
                      onChange={() => toggle(srv.name, 'patch', p)}
                    />
                    <span className="text-sm">{p || "(empty)"}</span>
                  </label>
                ))}
              </div>
  
              {/* Final Service */}
              <div>
                <div className="text-xs font-semibold mb-1">Final</div>
                {srv.final.map(f => (
                  <label key={f} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={(selectedData[srv.name]?.final || []).includes(f)}
                      onChange={() => toggle(srv.name, 'final', f)}
                    />
                    <span className="text-sm">{f || "(empty)"}</span>
                  </label>
                ))}
              </div>
  
            </div>
          </div>
        ))}
  
        {/* SUBMIT BUTTON */}
        <button
          className="w-full bg-[#FB8C00] text-white py-2 rounded-lg mt-3"
          onClick={() => onSubmit(selectedData)}
        >
          Submit
        </button>
      </div>
    );
  }
  