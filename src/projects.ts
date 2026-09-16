import type { Project } from './types'

export const isArchived = (project: Project) => Boolean(project.archivedAt)

export function activeProjects(projects: Project[]): Project[] {
  return projects.filter((p) => !isArchived(p))
}

export function subtreeIds(projects: Project[], id: string): Set<string> {
  const ids = new Set([id])
  let frontier = [id]

  while (frontier.length > 0) {
    const next = projects
      .filter((p) => p.parentId && frontier.includes(p.parentId) && !ids.has(p.id))
      .map((p) => p.id)
    next.forEach((childId) => ids.add(childId))
    frontier = next
  }

  return ids
}

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
