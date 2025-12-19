import { useState } from "react";

export default function MultiStepUI({ meta, onSubmit }) {
    const [state, setState] = useState(
      meta.steps.reduce((a, s) => {
        a[s.step] = "";
        return a;
      }, {})
    );
  
    const update = (step, value) => {
      setState({ ...state, [step]: value });
    };
  
    return (
      <div className="step-card">
        <h3 className="service-title">{meta.service}</h3>
  
        {meta.steps.map((s, i) => (
          <div className="step-block" key={i}>
            <h4>Step {i + 1}: Select the {s.step}</h4>
  
            {s.options.map((opt, index) => (
              <label key={index} className="step-option">
                <input
                  type="radio"
                  name={s.step}
                  value={opt}
                  checked={state[s.step] === opt}
                  onChange={() => update(s.step, opt)}
                />
                <span>{opt || "(empty)"}</span>
              </label>
            ))}
          </div>
        ))}
  
        <button
          className="submit-btn"
          onClick={() => onSubmit(state)}
        >
          Submit
        </button>
      </div>
    );
  }
  