'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

type ReaderContextType = {
  file: File | null
  setFile: (file: File | null) => void
}

const ReaderContext = createContext<ReaderContextType>({
  file: null,
  setFile: () => {},
})

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [file, setFile] = useState<File | null>(null)
  return (
    <ReaderContext.Provider value={{ file, setFile }}>
      {children}
    </ReaderContext.Provider>
  )
}

export function useReader() {
  return useContext(ReaderContext)
}