import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Copy, Check, Edit2, Music, Sparkles, Hash, AtSign, Space, type LucideIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePassphrases } from "@/api/generate";
import { BuildInfo, DevelopmentBuildInfo } from "@/components/BuildInfo";
import { track } from "@/lib/analytics";
import { readStoredJSON, readStoredString } from "@/lib/storage";

interface OptionPillConfig {
  key: "addNumber" | "addSpecialChar" | "includeSpaces";
  label: string;
  icon: LucideIcon;
  activeClass: string;
}

const OPTION_PILLS: OptionPillConfig[] = [
  {
    key: "addNumber",
    label: "Numbers",
    icon: Hash,
    activeClass: "bg-purple-100 text-purple-700 ring-1 ring-purple-200 shadow-sm",
  },
  {
    key: "addSpecialChar",
    label: "Symbols",
    icon: AtSign,
    activeClass: "bg-pink-100 text-pink-700 ring-1 ring-pink-200 shadow-sm",
  },
  {
    key: "includeSpaces",
    label: "Spaces",
    icon: Space,
    activeClass: "bg-orange-100 text-orange-700 ring-1 ring-orange-200 shadow-sm",
  },
];

const Index = () => {
  const [keywords, setKeywords] = useState(() =>
    readStoredString("musicPassphrase_keywords", "")
  );
  const [addNumber, setAddNumber] = useState(() =>
    readStoredJSON("musicPassphrase_addNumber", true)
  );
  const [addSpecialChar, setAddSpecialChar] = useState(() =>
    readStoredJSON("musicPassphrase_addSpecialChar", true)
  );
  const [includeSpaces, setIncludeSpaces] = useState(() =>
    readStoredJSON("musicPassphrase_includeSpaces", true)
  );
  const [length, setLength] = useState(() =>
    readStoredJSON("musicPassphrase_length", 10)
  );
  const [editedPassphrases, setEditedPassphrases] = useState<string[]>([]);
  const [resultSource, setResultSource] = useState<"api" | "mock" | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const optionValues = { addNumber, addSpecialChar, includeSpaces };
  const optionSetters = {
    addNumber: setAddNumber,
    addSpecialChar: setAddSpecialChar,
    includeSpaces: setIncludeSpaces,
  };

  const mutation = useMutation({
    mutationFn: generatePassphrases,
    onSuccess: ({ passphrases, source }) => {
      setEditedPassphrases(passphrases);
      setResultSource(source);
      setEditingIndex(null);
      if (source === "api") {
        toast({
          title: "Success!",
          description: "Generated passphrases",
        });
      }
      track("generate_passphrase", {
        artist_count: keywords.split(",").length,
        with_numbers: addNumber,
        with_symbols: addSpecialChar,
        source,
      });
    },
    onError: (error: Error) => {
      console.error("Error generating passphrases:", error);
      toast({
        title: "Error",
        description: "Failed to generate passphrases. Please try again.",
        variant: "destructive",
      });
      track("api_error", {
        error_message: error.message,
      });
    },
  });

  // Persist state to localStorage
  useEffect(() => {
    localStorage.setItem("musicPassphrase_keywords", keywords);
    localStorage.setItem(
      "musicPassphrase_addNumber",
      JSON.stringify(addNumber)
    );
    localStorage.setItem(
      "musicPassphrase_addSpecialChar",
      JSON.stringify(addSpecialChar)
    );
    localStorage.setItem(
      "musicPassphrase_includeSpaces",
      JSON.stringify(includeSpaces)
    );
    localStorage.setItem(
      "musicPassphrase_length",
      JSON.stringify(length)
    );
  }, [keywords, addNumber, addSpecialChar, includeSpaces, length]);

  const handleGenerateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mutation.isPending) return;
    if (!keywords.trim()) {
      toast({
        title: "Error",
        description: "Please enter a music artist name",
        variant: "destructive",
      });
      return;
    }
    mutation.mutate({
      keywords: keywords.trim(),
      addNumber,
      addSpecialChar,
      includeSpaces,
      length,
    });
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
      toast({
        title: "Copied!",
        description: "Passphrase copied to clipboard",
      });
      track("copy_passphrase", { passphrase_index: index });
    } catch (error) {
      console.error("Failed to copy:", error);
      toast({
        title: "Error",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const handleEditSave = (value: string, index: number) => {
    if (value.trim() === "") {
      toast({
        title: "Error",
        description: "Passphrase cannot be empty",
        variant: "destructive",
      });
      return;
    }

    const newEditedPassphrases = [...editedPassphrases];
    newEditedPassphrases[index] = value.trim();
    setEditedPassphrases(newEditedPassphrases);
    setEditingIndex(null);

    toast({
      title: "Saved!",
      description: "Passphrase has been updated",
    });
  };

  const handleEditKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Enter") {
      handleEditSave(e.currentTarget.value, index);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Pastel background blobs */}
      <div className="fixed inset-0 bg-blob-1 pointer-events-none" />
      <div className="fixed inset-0 bg-blob-2 pointer-events-none" />
      <div className="fixed inset-0 bg-blob-3 pointer-events-none" />

      <div className="relative z-10 max-w-2xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-200 to-pink-200 mb-5 shadow-sm">
            <Music className="h-8 w-8 text-purple-500" />
          </div>
          <h1 className="font-display text-4xl sm:text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-orange-300 bg-clip-text text-transparent mb-3">
            Music Passphrase
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md mx-auto">
            Turn your favorite artists into secure, memorable passphrases
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-6 shadow-xl shadow-purple-100/50 border border-purple-100/60 bg-white/60 backdrop-blur-xl rounded-2xl">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={handleGenerateSubmit} className="space-y-6">
              {/* Artist Input */}
              <div className="space-y-2">
                <Label
                  htmlFor="keywords"
                  className="text-sm font-medium text-purple-900/70"
                >
                  Artist name
                </Label>
                <div className="relative">
                  <Music className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-purple-300" />
                  <Input
                    id="keywords"
                    value={keywords}
                    onChange={(e) => setKeywords(e.target.value)}
                    placeholder="Taylor Swift, The Beatles..."
                    className="h-14 pl-12 rounded-xl border-purple-200/60 bg-white/80 text-[1.15rem] focus:border-purple-300 focus:ring-purple-200 placeholder:text-purple-300/60"
                    disabled={mutation.isPending}
                  />
                </div>
              </div>

              {/* Option Pills */}
              <div className="flex flex-wrap gap-3">
                {OPTION_PILLS.map(({ key, label, icon: Icon, activeClass }) => {
                  const isActive = optionValues[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => {
                        const next = !isActive;
                        optionSetters[key](next);
                        track("toggle_option", { option_name: label.toLowerCase(), option_state: next });
                      }}
                      disabled={mutation.isPending}
                      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                        isActive
                          ? activeClass
                          : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      {label}
                    </button>
                  );
                })}
              </div>

              {/* Length Control */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="length" className="text-sm font-medium text-purple-900/70">
                    Length
                  </Label>
                  <span className="text-sm font-semibold text-purple-500 tabular-nums">
                    {length} characters
                  </span>
                </div>
                <input
                  id="length"
                  type="range"
                  min={5}
                  max={20}
                  value={length}
                  onChange={(e) => setLength(Number(e.target.value))}
                  disabled={mutation.isPending}
                  aria-valuetext={`${length} characters`}
                  className="w-full h-2 rounded-full appearance-none cursor-pointer bg-purple-100 accent-purple-400 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300 focus-visible:ring-offset-2"
                />
                <div className="flex justify-between text-xs text-purple-300">
                  <span>5</span>
                  <span>20</span>
                </div>
              </div>

              {/* Generate Button */}
              <Button
                type="submit"
                disabled={mutation.isPending}
                aria-busy={mutation.isPending}
                className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                {mutation.isPending ? "Generating..." : "Generate Passphrases"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Results Section */}
        {editedPassphrases.length > 0 && (
          <div className="space-y-3" aria-live="polite">
            <h2 className="text-sm font-medium text-purple-900/50 uppercase tracking-wider px-1">
              Your passphrases
            </h2>
            {resultSource === "mock" && (
              <p className="text-xs text-orange-600/80 bg-orange-50 border border-orange-100 rounded-lg px-3 py-2">
                Live generation unavailable — showing sample passphrases.
              </p>
            )}
            <ul className="space-y-3">
              {editedPassphrases.map((passphrase, index) => (
                <li
                  key={index}
                  className="passphrase-row flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100/40 shadow-sm"
                >
                  {editingIndex === index ? (
                    <Input
                      defaultValue={passphrase}
                      onBlur={(e) => handleEditSave(e.target.value, index)}
                      onKeyDown={(e) => handleEditKeyDown(e, index)}
                      autoFocus
                      aria-label={`Edit passphrase ${index + 1}`}
                      className="flex-grow bg-white/80 rounded-lg border-purple-200"
                    />
                  ) : (
                    <p className="flex-grow text-purple-900/80 font-mono text-base sm:text-lg break-all leading-relaxed">
                      {passphrase}
                    </p>
                  )}
                  <div className="flex items-center ml-3 gap-1">
                    <button
                      onClick={() => setEditingIndex(index)}
                      className="p-2 rounded-lg text-purple-400 hover:text-purple-500 hover:bg-purple-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                      aria-label="Edit passphrase"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => copyToClipboard(passphrase, index)}
                      className="p-2 rounded-lg text-purple-400 hover:text-purple-500 hover:bg-purple-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-300"
                      aria-label={copiedIndex === index ? "Copied" : "Copy passphrase"}
                    >
                      {copiedIndex === index ? (
                        <Check className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Loading State */}
        {mutation.isPending && editedPassphrases.length === 0 && (
          <div className="text-center py-16" aria-live="polite">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-4">
              <Loader2 className="h-5 w-5 text-purple-400 animate-spin" />
            </div>
            <p className="text-purple-900/40 text-base">
              Generating your passphrases...
            </p>
          </div>
        )}

        {/* Empty State */}
        {editedPassphrases.length === 0 && !mutation.isPending && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-50 mb-4">
              <Sparkles className="h-5 w-5 text-purple-300" />
            </div>
            <p className="text-purple-900/40 text-base">
              Enter an artist and generate your first passphrase
            </p>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 text-center text-purple-900/30 text-xs">
          <DevelopmentBuildInfo />
          <BuildInfo />
          <p className="mt-1">
            Made with <span className="text-pink-300">&hearts;</span> by Music Passphrase
          </p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
