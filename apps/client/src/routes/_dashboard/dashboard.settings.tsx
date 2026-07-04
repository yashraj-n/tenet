import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "../../integrations/trpc/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff, Key, Cpu, ChevronsUpDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export const Route = createFileRoute("/_dashboard/dashboard/settings")({
  component: ModelSettingsPage,
});

interface ProviderData {
  id: string;
  name: string;
  slug: string;
  docUrl: string;
}

const PROVIDERS: ProviderData[] = [
  { id: "google", name: "Google Gemini", slug: "google", docUrl: "https://aistudio.google.com/" },
  { id: "openai", name: "OpenAI", slug: "openai", docUrl: "https://platform.openai.com/api-keys" },
  {
    id: "anthropic",
    name: "Anthropic Claude",
    slug: "anthropic",
    docUrl: "https://console.anthropic.com/",
  },
  { id: "azure", name: "Azure OpenAI", slug: "azure", docUrl: "https://portal.azure.com/" },
  { id: "cohere", name: "Cohere", slug: "cohere", docUrl: "https://dashboard.cohere.com/" },
  { id: "mistral", name: "Mistral", slug: "mistral", docUrl: "https://console.mistral.ai/" },
  { id: "openrouter", name: "OpenRouter", slug: "openrouter", docUrl: "https://openrouter.ai/" },
];

function ModelSettingsPage() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [selectedProvider, setSelectedProvider] = useState<ProviderData | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [openModelPopover, setOpenModelPopover] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState("");

  const { data: availableModels = [] } = useQuery(trpc.getAvailableModels.queryOptions()) as any;
  const { data: activeConfigs = [] } = useQuery(trpc.getProviderConfigs.queryOptions()) as any;

  const saveConfig = useMutation(
    trpc.saveProviderConfig.mutationOptions({
      onSuccess: () => {
        toast.success(`Successfully configured ${selectedProvider?.name}`);
        queryClient.invalidateQueries(trpc.getProviderConfigs.queryFilter());
        setSelectedProvider(null);
        setApiKey("");
        setSelectedModel("");
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save configuration");
      },
    }),
  );

  const providerModels = (availableModels as any[]).filter(
    (m) =>
      m.provider === selectedProvider?.slug ||
      (selectedProvider?.slug === "azure" && m.provider === "openai") ||
      (selectedProvider?.slug === "openrouter" &&
        ["google", "openai", "anthropic", "cohere", "mistral"].includes(m.provider)),
  );

  const handleOpenConfigure = (provider: ProviderData) => {
    setSelectedProvider(provider);
    const existing = (activeConfigs as any[]).find((c: any) => c.provider === provider.slug);
    const modelId = existing?.modelName || "";
    setApiKey("");
    setShowKey(false);

    const modelsForThisProvider = (availableModels as any[]).filter(
      (m) =>
        m.provider === provider.slug ||
        (provider.slug === "azure" && m.provider === "openai") ||
        (provider.slug === "openrouter" &&
          ["google", "openai", "anthropic", "cohere", "mistral"].includes(m.provider)),
    );
    const isModelInList = modelsForThisProvider.some((m) => m.id === modelId);

    if (modelId && !isModelInList) {
      setUseCustomModel(true);
      setCustomModelName(modelId);
      setSelectedModel("");
    } else {
      setUseCustomModel(false);
      setCustomModelName("");
      setSelectedModel(modelId);
    }
  };

  const handleSave = () => {
    if (!selectedProvider) return;
    if (!apiKey.trim()) {
      toast.error("API Key is required");
      return;
    }
    const finalModel = useCustomModel ? customModelName.trim() : selectedModel;
    saveConfig.mutate({
      provider: selectedProvider.slug,
      apiKey: apiKey.trim(),
      modelName: finalModel || null,
    });
  };

  return (
    <div className="flex-1 flex flex-col p-8 lg:p-12 max-w-5xl mx-auto w-full space-y-8 animate-fade-in">
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-display tracking-tight text-foreground">Model Settings</h1>
        <p className="text-muted-foreground text-sm max-w-2xl font-sans">
          Configure API credentials and select preferred models for each provider. Keys are
          encrypted using AES-256 and stored securely.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {PROVIDERS.map((provider) => {
          const config = (activeConfigs as any[]).find((c: any) => c.provider === provider.slug);
          const logoUrl = `https://models.dev/logos/${provider.id}.svg`;

          return (
            <Card
              key={provider.id}
              className="bg-card/40 border-border/80 backdrop-blur-md relative overflow-hidden group hover:border-[#eca8d6]/30 transition-all duration-300"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl bg-foreground/[0.03] border border-border/40 flex items-center justify-center p-2">
                    <img
                      src={logoUrl}
                      alt={provider.name}
                      className="max-h-full max-w-full object-contain invert"
                    />
                  </div>
                  <div>
                    <CardTitle className="text-base font-sans font-medium text-foreground">
                      {provider.name}
                    </CardTitle>
                    <CardDescription className="text-xs text-muted-foreground font-mono">
                      {config?.modelName || "No default model selected"}
                    </CardDescription>
                  </div>
                </div>

                <Badge
                  className={
                    config?.hasKey
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/25"
                      : "bg-zinc-500/10 text-zinc-400 border-zinc-500/20 hover:bg-zinc-500/25"
                  }
                  variant="outline"
                >
                  {config?.hasKey ? "Configured" : "Not Configured"}
                </Badge>
              </CardHeader>

              <CardContent className="pt-2 flex items-center justify-between border-t border-border/20 mt-2 bg-foreground/[0.01]">
                <span className="text-[11px] font-mono text-muted-foreground">
                  {config?.updatedAt
                    ? `Updated: ${new Date(config.updatedAt).toLocaleDateString()}`
                    : "Not active"}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleOpenConfigure(provider)}
                  className="h-8 border border-border/60 hover:bg-[#eca8d6]/10 hover:text-[#eca8d6] font-mono text-xs"
                >
                  Configure
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Sheet open={selectedProvider !== null} onOpenChange={() => setSelectedProvider(null)}>
        {selectedProvider && (
          <SheetContent className="bg-card/95 border-l border-border backdrop-blur-xl w-full sm:max-w-md flex flex-col">
            <SheetHeader className="space-y-3 pb-6 border-b border-border/60">
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 rounded-xl bg-foreground/[0.03] border border-border/40 flex items-center justify-center p-2">
                  <img
                    src={`https://models.dev/logos/${selectedProvider.id}.svg`}
                    alt={selectedProvider.name}
                    className="max-h-full max-w-full object-contain invert"
                  />
                </div>
                <SheetTitle className="text-xl font-display text-foreground">
                  Configure {selectedProvider.name}
                </SheetTitle>
              </div>
              <SheetDescription className="text-xs text-muted-foreground font-sans">
                Provide your API key and default model. The key will be securely encrypted with
                AES-256 before saving.
              </SheetDescription>
            </SheetHeader>

            <div className="flex-1 py-8 space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="apiKey"
                  className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5"
                >
                  <Key className="w-3.5 h-3.5 text-[#eca8d6]" />
                  <span>API Key</span>
                </Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showKey ? "text" : "password"}
                    placeholder="Enter your key here"
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="bg-background border-border pr-10 focus-visible:ring-[#eca8d6]/30 font-mono text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-2.5 text-muted-foreground/60 hover:text-foreground"
                  >
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[10px] text-muted-foreground font-sans">
                  Get your key from the{" "}
                  <a
                    href={selectedProvider.docUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#eca8d6] hover:underline"
                  >
                    {selectedProvider.name} Dashboard
                  </a>
                  .
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label
                    htmlFor="modelSelect"
                    className="text-xs font-mono text-muted-foreground uppercase flex items-center gap-1.5"
                  >
                    <Cpu className="w-3.5 h-3.5 text-[#eca8d6]" />
                    <span>Default Model</span>
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setUseCustomModel(!useCustomModel);
                      if (!useCustomModel) {
                        setCustomModelName(selectedModel);
                        setSelectedModel("");
                      } else {
                        setSelectedModel(customModelName);
                        setCustomModelName("");
                      }
                    }}
                    className="text-[10px] font-mono text-[#eca8d6] hover:underline cursor-pointer focus:outline-none"
                  >
                    {useCustomModel ? "Select from list" : "Enter custom model ID"}
                  </button>
                </div>

                {useCustomModel ? (
                  <Input
                    placeholder="e.g. gemini-2.5-flash-exp"
                    value={customModelName}
                    onChange={(e) => setCustomModelName(e.target.value)}
                    className="bg-background border-border focus-visible:ring-[#eca8d6]/30 font-mono text-sm h-10 px-3"
                  />
                ) : (
                  <Popover open={openModelPopover} onOpenChange={setOpenModelPopover}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openModelPopover}
                        className="w-full justify-between bg-background border-border hover:bg-background/80 text-foreground font-mono text-sm h-10 px-3"
                      >
                        <span className="truncate">
                          {selectedModel
                            ? (providerModels as any[]).find((model) => model.id === selectedModel)
                                ?.name || selectedModel
                            : "Select default model"}
                        </span>
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border z-[100]">
                      <Command className="bg-transparent">
                        <CommandInput
                          placeholder="Search models..."
                          className="font-mono text-xs border-none focus:ring-0 focus:outline-none"
                        />
                        <CommandList className="max-h-[200px] overflow-y-auto">
                          <CommandEmpty className="py-2 text-center text-xs text-muted-foreground font-mono">
                            No model found.
                          </CommandEmpty>
                          <CommandGroup>
                            {(providerModels as any[]).map((model) => (
                              <CommandItem
                                key={model.id}
                                value={model.id}
                                keywords={[model.name, model.id]}
                                onSelect={(currentValue) => {
                                  setSelectedModel(currentValue);
                                  setOpenModelPopover(false);
                                }}
                                className="font-mono text-xs cursor-pointer flex items-center justify-between py-2 px-3 hover:bg-foreground/[0.04]"
                              >
                                <span className="truncate">{model.name}</span>
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 text-[#eca8d6]",
                                    selectedModel === model.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                <p className="text-[10px] text-muted-foreground font-sans">
                  {useCustomModel
                    ? "Enter the precise identifier of your custom model."
                    : "Select the model configured to execute tasks for this provider."}
                </p>
              </div>
            </div>

            <SheetFooter className="pt-6 border-t border-border/60">
              <Button
                onClick={handleSave}
                disabled={saveConfig.isPending}
                className="w-full bg-[#eca8d6] hover:bg-[#eca8d6]/85 text-black font-semibold font-mono"
              >
                {saveConfig.isPending ? "Saving..." : "Save Configuration"}
              </Button>
            </SheetFooter>
          </SheetContent>
        )}
      </Sheet>
    </div>
  );
}
