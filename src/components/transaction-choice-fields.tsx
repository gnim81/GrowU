"use client";

import { useMemo, useState } from "react";

type ChoiceOption = {
  id: string;
  name: string;
};

type ItemOption = ChoiceOption & {
  defaultPoints: number;
  childId: string | null;
  scopeLabel: string;
};

function ChoiceTags({
  label,
  name,
  options,
  value,
  onChange,
  renderLabel
}: {
  label: string;
  name: string;
  options: ChoiceOption[];
  value: string;
  onChange: (value: string) => void;
  renderLabel?: (option: ChoiceOption) => string;
}) {
  const primaryOptions = options.slice(0, 3);
  const moreOptions = options.slice(3);

  return (
    <div className="field">
      <span className="label">{label}</span>
      <input name={name} type="hidden" value={value} required />
      <div className="flex flex-wrap gap-2">
        {primaryOptions.map((option) => {
          const active = option.id === value;
          return (
            <button
              className={`btn ${active ? "btn-primary" : "btn-secondary"}`}
              key={option.id}
              type="button"
              onClick={() => onChange(option.id)}
            >
              {renderLabel ? renderLabel(option) : option.name}
            </button>
          );
        })}
        {moreOptions.length > 0 ? (
          <select className="input w-auto min-w-32" value={moreOptions.some((option) => option.id === value) ? value : ""} onChange={(event) => onChange(event.target.value)}>
            <option value="">更多...</option>
            {moreOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {renderLabel ? renderLabel(option) : option.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>
    </div>
  );
}

export function TransactionChoiceFields({
  children,
  items,
  selectedChildId
}: {
  children: ChoiceOption[];
  items: ItemOption[];
  selectedChildId?: string;
}) {
  const [childId, setChildId] = useState(selectedChildId ?? "");
  const [itemId, setItemId] = useState("");
  const [points, setPoints] = useState("");
  const filteredItems = useMemo(
    () => (childId ? items.filter((item) => item.childId === null || item.childId === childId) : []),
    [childId, items]
  );
  const selectedItem = useMemo(() => filteredItems.find((item) => item.id === itemId), [itemId, filteredItems]);

  function selectItem(nextItemId: string) {
    const nextItem = filteredItems.find((item) => item.id === nextItemId);
    setItemId(nextItemId);
    setPoints(nextItem ? String(nextItem.defaultPoints) : "");
  }

  function selectChild(nextChildId: string) {
    setChildId(nextChildId);
    const stillAvailable = items.some((item) => item.id === itemId && (item.childId === null || item.childId === nextChildId));

    if (!stillAvailable) {
      setItemId("");
      setPoints("");
    }
  }

  return (
    <>
      <ChoiceTags label="孩子" name="childId" options={children} value={childId} onChange={selectChild} />
      <ChoiceTags
        label="项目"
        name="itemId"
        options={filteredItems}
        value={itemId}
        onChange={selectItem}
        renderLabel={(option) => {
          const item = option as ItemOption;
          return `${item.name}（${item.defaultPoints}，${item.scopeLabel}）`;
        }}
      />
      {childId ? null : <p className="badge badge-info w-fit py-1">请先选择档案，再选择可用项目。</p>}
      <label className="field">
        <span className="label">实际分值</span>
        <input
          className="input"
          name="points"
          type="number"
          min={1}
          value={points}
          onChange={(event) => setPoints(event.target.value)}
          readOnly={!selectedItem}
          required
        />
      </label>
    </>
  );
}
