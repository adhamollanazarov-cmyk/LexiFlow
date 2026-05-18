"use client";

import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from "react";

type ReaderContextValue = {
  pdfFile: File | null;
  pdfName: string | null;
  setPdfFile: (file: File | null) => void;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [pdfFile, setPdfFileState] = useState<File | null>(null);

  function setPdfFile(file: File | null) {
    setPdfFileState(file);
  }

  const value = useMemo<ReaderContextValue>(
    () => ({
      pdfFile,
      pdfName: pdfFile?.name ?? null,
      setPdfFile,
    }),
    [pdfFile]
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

export function useReader() {
  const context = useContext(ReaderContext);

  if (!context) {
    throw new Error("useReader must be used inside ReaderProvider");
  }

  return context;
}
