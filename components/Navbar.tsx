'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSession, signOut } from 'next-auth/react'
import { Disclosure, Menu, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon, UserCircleIcon } from '@heroicons/react/24/outline'
import { Fragment } from 'react'
import { ThemeToggle } from './ThemeToggle'

const navigation = [
  { name: 'Home', href: '/', current: true },
  { name: 'Browse', href: '/videos', current: false },
  { name: 'Upload', href: '/upload', current: false },
  { name: 'Slider Test', href: '/slider-test', current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function Navbar() {
  const { data: session, status } = useSession()

  return (
    <Disclosure as="nav" className="bg-white dark:bg-gray-800 shadow dark:shadow-gray-900/20 transition-colors">
      {({ open }) => (
        <>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 justify-between">
              <div className="flex">
                <div className="flex flex-shrink-0 items-center">
                  <Link href="/" className="text-2xl font-bold text-primary-600 dark:text-primary-400">
                    RateMe
                  </Link>
                </div>
                <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                  {navigation.map((item) => (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:items-center sm:space-x-4">
                <ThemeToggle />
                {status === 'loading' ? (
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-600 border-t-transparent" />
                ) : session ? (
                  <Menu as="div" className="relative ml-3">
                    <div>
                      <Menu.Button className="flex rounded-full bg-white dark:bg-gray-800 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors">
                        <span className="sr-only">Open user menu</span>
                        <UserCircleIcon className="h-8 w-8 text-gray-400 dark:text-gray-300" />
                      </Menu.Button>
                    </div>
                    <Transition
                      as={Fragment}
                      enter="transition ease-out duration-200"
                      enterFrom="transform opacity-0 scale-95"
                      enterTo="transform opacity-100 scale-100"
                      leave="transition ease-in duration-75"
                      leaveFrom="transform opacity-100 scale-100"
                      leaveTo="transform opacity-0 scale-95"
                    >
                      <Menu.Items className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white dark:bg-gray-700 py-1 shadow-lg ring-1 ring-black dark:ring-gray-600 ring-opacity-5 dark:ring-opacity-20 focus:outline-none">
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/profile"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-600' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                              )}
                            >
                              Your Profile
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <Link
                              href="/admin/nsfw"
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-600' : '',
                                'block px-4 py-2 text-sm text-gray-700 dark:text-gray-200'
                              )}
                            >
                              NSFW Admin
                            </Link>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => signOut()}
                              className={classNames(
                                active ? 'bg-gray-100 dark:bg-gray-600' : '',
                                'block w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200'
                              )}
                            >
                              Sign out
                            </button>
                          )}
                        </Menu.Item>
                      </Menu.Items>
                    </Transition>
                  </Menu>
                ) : (
                  <div className="flex space-x-4">
                    <Link
                      href="/auth/signin"
                      className="text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                    >
                      Sign in
                    </Link>
                    <Link
                      href="/auth/signup"
                      className="btn-primary px-4 py-2"
                    >
                      Sign up
                    </Link>
                  </div>
                )}
              </div>
              <div className="-mr-2 flex items-center sm:hidden">
                <Disclosure.Button className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-500 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors">
                  <span className="sr-only">Open main menu</span>
                  {open ? (
                    <XMarkIcon className="block h-6 w-6" aria-hidden="true" />
                  ) : (
                    <Bars3Icon className="block h-6 w-6" aria-hidden="true" />
                  )}
                </Disclosure.Button>
              </div>
            </div>
          </div>

          <Disclosure.Panel className="sm:hidden">
            <div className="space-y-1 pb-3 pt-2 bg-white dark:bg-gray-800 border-t dark:border-gray-700">
              <div className="px-3 py-2">
                <ThemeToggle />
              </div>
              {navigation.map((item) => (
                <Disclosure.Button
                  key={item.name}
                  as={Link}
                  href={item.href}
                  className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                >
                  {item.name}
                </Disclosure.Button>
              ))}
              {session && (
                <>
                  <Disclosure.Button
                    as={Link}
                    href="/profile"
                    className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  >
                    Your Profile
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/admin/nsfw"
                    className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  >
                    NSFW Admin
                  </Disclosure.Button>
                  <Disclosure.Button
                    as="button"
                    onClick={() => signOut()}
                    className="block w-full text-left border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  >
                    Sign out
                  </Disclosure.Button>
                </>
              )}
              {!session && status !== 'loading' && (
                <>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signin"
                    className="block border-l-4 border-transparent py-2 pl-3 pr-4 text-base font-medium text-gray-500 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 hover:text-gray-700 dark:hover:text-gray-100 transition-colors"
                  >
                    Sign in
                  </Disclosure.Button>
                  <Disclosure.Button
                    as={Link}
                    href="/auth/signup"
                    className="block border-l-4 border-blue-600 dark:border-blue-400 py-2 pl-3 pr-4 text-base font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                  >
                    Sign up
                  </Disclosure.Button>
                </>
              )}
            </div>
          </Disclosure.Panel>
        </>
      )}
    </Disclosure>
  )
}