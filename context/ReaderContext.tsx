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
  detectedSourceLang: string | null;
  setPdfFile: (file: File | null) => void;
  setDetectedSourceLang: (lang: string | null) => void;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [pdfFile, setPdfFileState] = useState<File | null>(null);
  const [detectedSourceLang, setDetectedSourceLang] = useState<string | null>(null);

  function setPdfFile(file: File | null) {
    setPdfFileState(file);
    if (!file) {
      setDetectedSourceLang(null);
    }
  }

  const value = useMemo<ReaderContextValue>(
    () => ({
      pdfFile,
      pdfName: pdfFile?.name ?? null,
      detectedSourceLang,
      setPdfFile,
      setDetectedSourceLang,
    }),
    [detectedSourceLang, pdfFile]
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
