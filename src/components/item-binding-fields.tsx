"use client";

import { useMemo, useState } from "react";

type ChildOption = {
  id: string;
  name: string;
  enabled: boolean;
};

export function ItemBindingFields({
  children,
  defaultScope,
  defaultChildId
}: {
  children: ChildOption[];
  defaultScope: "ALL" | "CHILD";
  defaultChildId?: string | null;
}) {
  const hasChildren = children.length > 0;
  const fallbackChildId = useMemo(() => children.find((child) => child.enabled)?.id ?? children[0]?.id ?? "", [children]);
  const [scope, setScope] = useState<"ALL" | "CHILD">(defaultScope);
  const [bindChildId, setBindChildId] = useState(defaultChildId ?? fallbackChildId);

  function handleScopeChange(nextScope: "ALL" | "CHILD") {
    setScope(nextScope);

    if (nextScope === "CHILD" && !bindChildId) {
      setBindChildId(fallbackChildId);
    }
  }

  return (
    <>
      <label className="field">
        <span className="label">适用范围</span>
        <select
          className="input"
          name="scope"
          value={scope}
          onChange={(event) => handleScopeChange(event.target.value as "ALL" | "CHILD")}
          required
        >
          <option value="ALL">全员可用</option>
          <option value="CHILD" disabled={!hasChildren}>
            仅指定档案
          </option>
        </select>
      </label>
      {scope === "CHILD" ? (
        <label className="field">
          <span className="label">绑定档案</span>
          <select
            className="input"
            name="bindChildId"
            value={bindChildId}
            onChange={(event) => setBindChildId(event.target.value)}
            required
          >
            <option value="">请选择档案</option>
            {children.map((child) => (
              <option key={child.id} value={child.id}>
                {child.name}
                {child.enabled ? "" : "（已停用）"}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      {scope === "CHILD" && !hasChildren ? <p className="badge badge-danger w-fit py-1">请先新增档案，再使用“仅指定档案”。</p> : null}
    </>
  );
}
