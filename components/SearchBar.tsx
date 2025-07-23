'use client'

import { useState } from 'react'
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline'

interface SearchBarProps {
  onSearch?: (query: string, tags: string[]) => void
}

export function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')

  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      const newTags = [...tags, tagInput.trim()]
      setTags(newTags)
      setTagInput('')
      onSearch?.(query, newTags)
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    const newTags = tags.filter(tag => tag !== tagToRemove)
    setTags(newTags)
    onSearch?.(query, newTags)
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch?.(query, tags)
  }

  return (
    <div className="mx-auto max-w-2xl">
      <form onSubmit={handleSearch} className="card">
        <div className="flex">
          <div className="flex-1">
            <label htmlFor="search" className="sr-only">
              Search videos
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>
              <input
                id="search"
                name="search"
                type="text"
                placeholder="Search videos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="block w-full rounded-md border-0 py-1.5 pl-10 pr-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <button
            type="submit"
            className="ml-3 btn-primary px-6"
          >
            Search
          </button>
        </div>

        <div className="mt-4">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Add tag..."
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
              className="block rounded-md border-0 py-1.5 px-3 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn-secondary px-4 py-1.5"
            >
              Add Tag
            </button>
          </div>
          
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-x-0.5 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="group relative -mr-1 h-3.5 w-3.5 rounded-sm hover:bg-blue-600/20"
                  >
                    <span className="sr-only">Remove</span>
                    <svg viewBox="0 0 14 14" className="h-3.5 w-3.5 stroke-blue-700/50 group-hover:stroke-blue-700/75">
                      <path d="m4 4 6 6m0-6-6 6" />
                    </svg>
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>
      </form>
    </div>
  )
}