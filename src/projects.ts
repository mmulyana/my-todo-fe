import type { Project } from './types'

export function childProjects(
  projects: Project[],
  parentId: string | null,
): Project[] {
  if (parentId !== null) return projects.filter((p) => p.parentId === parentId)
  const ids = new Set(projects.map((p) => p.id))
  return projects.filter((p) => !p.parentId || !ids.has(p.parentId))
}

export function projectTrail(projects: Project[], id: string): Project[] {
  const byId = new Map(projects.map((p) => [p.id, p]))
  const trail: Project[] = []
  const seen = new Set<string>([id])
  let parentId = byId.get(id)?.parentId

  while (parentId && !seen.has(parentId)) {
    seen.add(parentId)
    const parent = byId.get(parentId)
    if (!parent) break
    trail.unshift(parent)
    parentId = parent.parentId
  }

  return trail
}

export function flattenProjects(
  projects: Project[],
  parentId: string | null = null,
  depth = 0,
): { project: Project; depth: number }[] {
  return childProjects(projects, parentId).flatMap((project) => [
    { project, depth },
    ...flattenProjects(projects, project.id, depth + 1),
  ])
}

export const projectIndent = (depth: number) => '\u00a0\u00a0'.repeat(depth)
