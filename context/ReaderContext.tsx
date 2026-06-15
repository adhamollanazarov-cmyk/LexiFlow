"use client";

import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type ReaderContextValue = {
  pdfFile: File | null;
  pdfName: string | null;
  detectedSourceLang: string | null;
  languageSource: "auto" | "manual" | "unknown";
  autoDetectRequestId: number;
  setPdfFile: (file: File | null) => void;
  setDetectedSourceLang: (lang: string | null) => void;
  setManualSourceLang: (lang: string) => void;
  resetLanguageDetection: () => void;
};

const ReaderContext = createContext<ReaderContextValue | null>(null);

export function ReaderProvider({ children }: { children: ReactNode }) {
  const [pdfFile, setPdfFileState] = useState<File | null>(null);
  const [detectedSourceLang, setDetectedSourceLang] = useState<string | null>(null);
  const [languageSource, setLanguageSource] =
    useState<ReaderContextValue["languageSource"]>("unknown");
  const [autoDetectRequestId, setAutoDetectRequestId] = useState(0);

  const setPdfFile = useCallback((file: File | null) => {
    setPdfFileState(file);
    if (!file) {
      setDetectedSourceLang(null);
      setLanguageSource("unknown");
    }
  }, []);

  const handleDetectedSourceLang = useCallback((lang: string | null) => {
    setDetectedSourceLang(lang);
    setLanguageSource(lang ? "auto" : "unknown");
  }, []);

  const setManualSourceLang = useCallback((lang: string) => {
    setDetectedSourceLang(lang);
    setLanguageSource("manual");
  }, []);

  const resetLanguageDetection = useCallback(() => {
    setDetectedSourceLang(null);
    setLanguageSource("unknown");
    setAutoDetectRequestId((currentId) => currentId + 1);
  }, []);

  const value = useMemo<ReaderContextValue>(
    () => ({
      pdfFile,
      pdfName: pdfFile?.name ?? null,
      detectedSourceLang,
      languageSource,
      autoDetectRequestId,
      setPdfFile,
      setDetectedSourceLang: handleDetectedSourceLang,
      setManualSourceLang,
      resetLanguageDetection,
    }),
    [
      autoDetectRequestId,
      detectedSourceLang,
      handleDetectedSourceLang,
      languageSource,
      pdfFile,
      resetLanguageDetection,
      setManualSourceLang,
      setPdfFile,
    ]
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
