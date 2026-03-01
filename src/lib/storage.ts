import { StudioProject, Part } from './types'
import { uid } from './utils'

/**
 * Storage layer for Studio system (Projects and Parts)
 * Uses localStorage with 'sw_' prefix to avoid conflicts with existing Create page data
 */

const STORAGE_KEYS = {
  PROJECTS: 'sw_projects',
  PARTS: 'sw_parts',
  ACTIVE_PROJECT: 'sw_active_project',
} as const

// ============================================================
// Project Storage
// ============================================================

export const projectStorage = {
  /**
   * Get all projects (sorted newest first)
   */
  getAll(): StudioProject[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROJECTS)
      const projects = data ? JSON.parse(data) : []
      // Sort by createdAt descending (newest first)
      return projects.sort((a: StudioProject, b: StudioProject) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
    } catch (error) {
      console.error('Failed to load projects:', error)
      return []
    }
  },

  /**
   * Get project by ID
   */
  getById(id: string): StudioProject | null {
    const projects = this.getAll()
    return projects.find((p) => p.id === id) || null
  },

  /**
   * Create new project
   */
  create(
    project: Omit<StudioProject, 'id' | 'createdAt' | 'updatedAt'>
  ): StudioProject {
    const newProject: StudioProject = {
      ...project,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const projects = this.getAll()
    projects.push(newProject)
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))

    return newProject
  },

  /**
   * Update existing project
   */
  update(
    id: string,
    updates: Partial<Omit<StudioProject, 'id' | 'createdAt'>>
  ): StudioProject {
    const projects = this.getAll()
    const index = projects.findIndex((p) => p.id === id)

    if (index === -1) {
      throw new Error(`Project not found: ${id}`)
    }

    const updatedProject: StudioProject = {
      ...projects[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    projects[index] = updatedProject
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(projects))

    return updatedProject
  },

  /**
   * Delete project and all its parts
   */
  delete(id: string): void {
    // Delete all parts in this project
    const parts = partStorage.getByProjectId(id)
    parts.forEach((part) => partStorage.delete(part.id))

    // Delete the project
    const projects = this.getAll()
    const filtered = projects.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEYS.PROJECTS, JSON.stringify(filtered))
  },

  /**
   * Add part ID to project's partIds array
   */
  addPartId(projectId: string, partId: string): void {
    const project = this.getById(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    if (!project.partIds.includes(partId)) {
      this.update(projectId, {
        partIds: [...project.partIds, partId],
      })
    }
  },

  /**
   * Remove part ID from project's partIds array
   */
  removePartId(projectId: string, partId: string): void {
    const project = this.getById(projectId)
    if (!project) {
      throw new Error(`Project not found: ${projectId}`)
    }

    this.update(projectId, {
      partIds: project.partIds.filter((id) => id !== partId),
    })
  },
}

// ============================================================
// Part Storage
// ============================================================

export const partStorage = {
  /**
   * Get all parts
   */
  getAll(): Part[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PARTS)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to load parts:', error)
      return []
    }
  },

  /**
   * Get part by ID
   */
  getById(id: string): Part | null {
    const parts = this.getAll()
    return parts.find((p) => p.id === id) || null
  },

  /**
   * Get all parts in a project
   */
  getByProjectId(projectId: string): Part[] {
    const parts = this.getAll()
    return parts.filter((p) => p.projectId === projectId)
  },

  /**
   * Create new part
   */
  create(part: Omit<Part, 'id' | 'createdAt' | 'updatedAt'>): Part {
    const newPart: Part = {
      ...part,
      id: uid(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }

    const parts = this.getAll()
    parts.push(newPart)
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts))

    // Add part ID to project
    projectStorage.addPartId(newPart.projectId, newPart.id)

    return newPart
  },

  /**
   * Update existing part
   */
  update(
    id: string,
    updates: Partial<Omit<Part, 'id' | 'createdAt'>>
  ): Part {
    const parts = this.getAll()
    const index = parts.findIndex((p) => p.id === id)

    if (index === -1) {
      throw new Error(`Part not found: ${id}`)
    }

    const updatedPart: Part = {
      ...parts[index],
      ...updates,
      metadata: {
        ...parts[index].metadata,
        ...(updates.metadata || {}),
      },
      updatedAt: new Date().toISOString(),
    }

    parts[index] = updatedPart
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(parts))

    return updatedPart
  },

  /**
   * Delete part
   */
  delete(id: string): void {
    const part = this.getById(id)
    if (part) {
      // Remove from project's partIds
      projectStorage.removePartId(part.projectId, id)
    }

    const parts = this.getAll()
    const filtered = parts.filter((p) => p.id !== id)
    localStorage.setItem(STORAGE_KEYS.PARTS, JSON.stringify(filtered))
  },

  /**
   * Get derivation chain (all ancestor parts)
   * Returns parts in order: [root, parent, grandparent, ..., target]
   */
  getSourceChain(partId: string): Part[] {
    const chain: Part[] = []
    let currentId: string | null = partId

    while (currentId) {
      const part = this.getById(currentId)
      if (!part) break

      chain.unshift(part) // Add to beginning
      currentId = part.metadata.sourcePartId || null
    }

    return chain
  },

  /**
   * Get all parts derived from a source part
   */
  getDescendants(partId: string): Part[] {
    const parts = this.getAll()
    return parts.filter((p) => p.metadata.sourcePartId === partId)
  },
}

// ============================================================
// Active Project Storage
// ============================================================

export const activeProjectStorage = {
  /**
   * Get active project ID
   */
  get(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEYS.ACTIVE_PROJECT)
    } catch (error) {
      console.error('Failed to load active project:', error)
      return null
    }
  },

  /**
   * Set active project ID
   */
  set(projectId: string | null): void {
    try {
      if (projectId === null) {
        localStorage.removeItem(STORAGE_KEYS.ACTIVE_PROJECT)
      } else {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_PROJECT, projectId)
      }
    } catch (error) {
      console.error('Failed to save active project:', error)
    }
  },
}
