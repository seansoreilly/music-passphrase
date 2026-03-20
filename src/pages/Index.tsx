import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Loader2, Copy, Check, Edit2, Music, Sparkles, Hash, AtSign, Space } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generatePassphrases } from "@/api/generate";
import { BuildInfo, DevelopmentBuildInfo } from "@/components/BuildInfo";
import { track } from "@/lib/analytics";

const Index = () => {
  const [keywords, setKeywords] = useState("");
  const [addNumber, setAddNumber] = useState(true);
  const [addSpecialChar, setAddSpecialChar] = useState(true);
  const [includeSpaces, setIncludeSpaces] = useState(true);
  const [passphrases, setPassphrases] = useState<string[]>([]);
  const [editedPassphrases, setEditedPassphrases] = useState<string[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const mutation = useMutation({
    mutationFn: generatePassphrases,
    onSuccess: (newPassphrases) => {
      setPassphrases(newPassphrases);
      setEditedPassphrases([...newPassphrases]);
      setEditingIndex(null);
      toast({
        title: "Success!",
        description: "Generated passphrases",
      });
      track("generate_passphrase", {
        artist_count: keywords.split(",").length,
        with_numbers: addNumber,
        with_symbols: addSpecialChar,
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

  // Load saved states from localStorage on component mount
  useEffect(() => {
    const savedKeywords = localStorage.getItem("musicPassphrase_keywords");
    const savedAddNumber = localStorage.getItem("musicPassphrase_addNumber");
    const savedAddSpecialChar = localStorage.getItem(
      "musicPassphrase_addSpecialChar"
    );
    const savedIncludeSpaces = localStorage.getItem(
      "musicPassphrase_includeSpaces"
    );

    if (savedKeywords) {
      setKeywords(savedKeywords);
    }
    if (savedAddNumber) {
      setAddNumber(JSON.parse(savedAddNumber));
    }
    if (savedAddSpecialChar) {
      setAddSpecialChar(JSON.parse(savedAddSpecialChar));
    }
    if (savedIncludeSpaces) {
      setIncludeSpaces(JSON.parse(savedIncludeSpaces));
    }
  }, []);

  // Save state to localStorage
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
  }, [keywords, addNumber, addSpecialChar, includeSpaces]);

  const handleGenerateClick = () => {
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

  const handleEditStart = (index: number) => {
    setEditingIndex(index);
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

  const handleEditFinish = (value: string, index: number) => {
    if (value.trim() !== "") {
      const newEditedPassphrases = [...editedPassphrases];
      newEditedPassphrases[index] = value.trim();
      setEditedPassphrases(newEditedPassphrases);
    }
    setEditingIndex(null);
  };

  const handleEditKeyPress = (
    e: React.KeyboardEvent,
    index: number,
    value: string
  ) => {
    if (e.key === "Enter") {
      handleEditSave(value, index);
    } else if (e.key === "Escape") {
      setEditingIndex(null);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !mutation.isPending) {
      handleGenerateClick();
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
          <h1 className="font-display text-5xl font-bold tracking-tight bg-gradient-to-r from-purple-400 via-pink-400 to-orange-300 bg-clip-text text-transparent mb-3">
            Music Passphrase
          </h1>
          <p className="text-muted-foreground text-lg font-light max-w-md mx-auto">
            Turn your favorite artists into secure, memorable passphrases
          </p>
        </div>

        {/* Input Card */}
        <Card className="mb-6 shadow-xl shadow-purple-100/50 border border-purple-100/60 bg-white/60 backdrop-blur-xl rounded-2xl">
          <CardContent className="p-8">
            <div className="space-y-6">
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
                    onKeyPress={handleKeyPress}
                    placeholder="Taylor Swift, The Beatles..."
                    className="h-14 pl-12 rounded-xl border-purple-200/60 bg-white/80 focus:border-purple-300 focus:ring-purple-200 placeholder:text-purple-300/60"
                    style={{ fontSize: "1.15rem" }}
                    disabled={mutation.isPending}
                  />
                </div>
              </div>

              {/* Option Pills */}
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setAddNumber(!addNumber);
                    track("toggle_option", { option_name: "numbers", option_state: !addNumber });
                  }}
                  disabled={mutation.isPending}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    addNumber
                      ? "bg-purple-100 text-purple-700 ring-1 ring-purple-200 shadow-sm"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <Hash className="h-3.5 w-3.5" />
                  Numbers
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAddSpecialChar(!addSpecialChar);
                    track("toggle_option", { option_name: "symbols", option_state: !addSpecialChar });
                  }}
                  disabled={mutation.isPending}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    addSpecialChar
                      ? "bg-pink-100 text-pink-700 ring-1 ring-pink-200 shadow-sm"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <AtSign className="h-3.5 w-3.5" />
                  Symbols
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIncludeSpaces(!includeSpaces);
                    track("toggle_option", { option_name: "spaces", option_state: !includeSpaces });
                  }}
                  disabled={mutation.isPending}
                  className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium transition-all duration-200 ${
                    includeSpaces
                      ? "bg-orange-100 text-orange-700 ring-1 ring-orange-200 shadow-sm"
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100"
                  }`}
                >
                  <Space className="h-3.5 w-3.5" />
                  Spaces
                </button>
              </div>

              {/* Generate Button */}
              <Button
                onClick={handleGenerateClick}
                disabled={mutation.isPending}
                className="w-full h-14 text-base font-semibold rounded-xl bg-gradient-to-r from-purple-400 to-pink-400 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg shadow-purple-200/40 transition-all duration-300 hover:shadow-xl hover:shadow-purple-300/40 hover:-translate-y-0.5"
              >
                {mutation.isPending ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Sparkles className="mr-2 h-5 w-5" />
                )}
                Generate Passphrases
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results Section */}
        {passphrases.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-medium text-purple-900/50 uppercase tracking-wider px-1">
              Your passphrases
            </h2>
            {editedPassphrases.map((passphrase, index) => (
              <div
                key={index}
                className="passphrase-row flex items-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-purple-100/40 shadow-sm"
              >
                {editingIndex === index ? (
                  <Input
                    defaultValue={passphrase}
                    onBlur={(e) => handleEditFinish(e.target.value, index)}
                    onKeyPress={(e) =>
                      handleEditKeyPress(e, index, e.currentTarget.value)
                    }
                    autoFocus
                    className="flex-grow bg-white/80 rounded-lg border-purple-200"
                  />
                ) : (
                  <p className="flex-grow text-purple-900/80 font-mono text-base sm:text-lg break-all leading-relaxed">
                    {passphrase}
                  </p>
                )}
                <div className="flex items-center ml-3 gap-1">
                  <button
                    onClick={() => handleEditStart(index)}
                    className="p-2 rounded-lg text-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-colors"
                    aria-label="Edit passphrase"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => copyToClipboard(passphrase, index)}
                    className="p-2 rounded-lg text-purple-300 hover:text-purple-500 hover:bg-purple-50 transition-colors"
                    aria-label="Copy passphrase"
                  >
                    {copiedIndex === index ? (
                      <Check className="h-4 w-4 text-emerald-400" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {passphrases.length === 0 && !mutation.isPending && (
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
