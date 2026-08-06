import React, { useState } from "react";
import { Plus, Trash2, X, GripVertical } from "lucide-react";

function emptyGroup() {
  return { title: "", type: "single", required: false, options: [{ name: "", price: 0, default: false }] };
}

export default function ModifierGroupsEditor({ value, onChange }) {
  const [groups, setGroups] = useState(Array.isArray(value) && value.length ? value : []);

  const emit = (next) => {
    setGroups(next);
    onChange?.(next);
  };

  const addGroup = () => emit([...groups, emptyGroup()]);

  const updateGroup = (gi, patch) => emit(groups.map((g, i) => (i === gi ? { ...g, ...patch } : g)));

  const removeGroup = (gi) => emit(groups.filter((_, i) => i !== gi));

  const addOption = (gi) =>
    updateGroup(gi, { options: [...groups[gi].options, { name: "", price: 0, default: false }] });

  const updateOption = (gi, oi, patch) =>
    updateGroup(gi, {
      options: groups[gi].options.map((o, i) => (i === oi ? { ...o, ...patch } : o)),
    });

  const removeOption = (gi, oi) =>
    updateGroup(gi, { options: groups[gi].options.filter((_, i) => i !== oi) });

  const setDefaultSingle = (gi, oi) =>
    updateGroup(gi, {
      options: groups[gi].options.map((o, i) => (i === oi ? { ...o, default: true } : { ...o, default: false })),
    });

  const inputCls = "w-full h-9 rounded-lg bg-background border border-border px-2 text-xs";

  return (
    <div className="space-y-3">
      {groups.map((g, gi) => (
        <div key={gi} className="rounded-xl border border-border bg-card p-3 space-y-2">
          <div className="flex items-center gap-2">
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <input
              value={g.title}
              onChange={(e) => updateGroup(gi, { title: e.target.value })}
              placeholder="Group title (e.g. Choose your sauce)"
              className={inputCls}
            />
            <button onClick={() => removeGroup(gi)} className="text-muted-foreground hover:text-destructive shrink-0">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-3 pl-6">
            <label className="flex items-center gap-1.5 text-xs">
              <select
                value={g.type}
                onChange={(e) => updateGroup(gi, { type: e.target.value })}
                className="h-8 rounded-lg bg-background border border-border px-2 text-xs"
              >
                <option value="single">Choose one</option>
                <option value="multi">Choose many</option>
              </select>
            </label>
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={!!g.required}
                onChange={(e) => updateGroup(gi, { required: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              Required
            </label>
          </div>

          <div className="pl-6 space-y-1.5">
            {g.options.map((o, oi) => (
              <div key={oi} className="flex items-center gap-2">
                <input
                  value={o.name}
                  onChange={(e) => updateOption(gi, oi, { name: e.target.value })}
                  placeholder="Option (e.g. No lettuce)"
                  className={inputCls}
                />
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-xs text-muted-foreground">$</span>
                  <input
                    value={o.price}
                    onChange={(e) => updateOption(gi, oi, { price: Number(e.target.value) || 0 })}
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    className="w-14 h-9 rounded-lg bg-background border border-border px-2 text-xs"
                  />
                </div>
                <label
                  className="flex items-center gap-1 text-[10px] text-muted-foreground shrink-0 w-16"
                  title="Default selected"
                >
                  <input
                    type="checkbox"
                    checked={!!o.default}
                    onChange={(e) => {
                      if (g.type === "single" && e.target.checked) setDefaultSingle(gi, oi);
                      else updateOption(gi, oi, { default: e.target.checked });
                    }}
                    className="w-4 h-4 accent-primary"
                  />
                  Default
                </label>
                <button
                  onClick={() => removeOption(gi, oi)}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={() => addOption(gi)}
              className="flex items-center gap-1 text-xs text-primary font-medium pl-1 pt-1"
            >
              <Plus className="w-3.5 h-3.5" /> Add option
            </button>
          </div>
        </div>
      ))}
      <button
        onClick={addGroup}
        className="w-full h-10 rounded-xl border border-dashed border-border text-xs font-semibold text-muted-foreground flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" /> Add customization group
      </button>
    </div>
  );
}