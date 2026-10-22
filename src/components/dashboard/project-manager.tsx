"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Plus, FolderOpen, Trash2 } from "lucide-react";
import type { Project } from "@/db/schema";

interface ProjectManagerProps {
  projects: Project[];
  selectedProject: Project | null;
  onSelect: (project: Project) => void;
  onCreate: (name: string, description?: string) => void;
  onDelete: (id: number) => void;
}

export function ProjectManager({
  projects,
  selectedProject,
  onSelect,
  onCreate,
  onDelete,
}: ProjectManagerProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const submit = () => {
    if (!newName.trim()) return;
    onCreate(newName.trim(), newDescription.trim());
    setNewName("");
    setNewDescription("");
    setIsCreating(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Projects</h2>
        <Button size="sm" variant="secondary" onClick={() => setIsCreating(true)}>
          <Plus className="h-4 w-4" />
          New
        </Button>
      </div>

      {isCreating && (
        <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
          <input
            type="text"
            placeholder="Project name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
          <textarea
            placeholder="Description (optional)"
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
            rows={2}
          />
          <div className="mt-2 flex gap-2">
            <Button size="sm" onClick={submit} className="flex-1">
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setIsCreating(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="space-y-1">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelect(project)}
            className={`group flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
              selectedProject?.id === project.id
                ? "bg-indigo-50 text-indigo-700"
                : "text-slate-700 hover:bg-slate-100"
            }`}
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span className="truncate">{project.name}</span>
            </div>
            <Trash2
              className="h-4 w-4 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 hover:text-rose-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            />
          </button>
        ))}
        {projects.length === 0 && !isCreating && (
          <p className="px-3 py-2 text-sm text-slate-500">No projects yet.</p>
        )}
      </div>
    </div>
  );
}
