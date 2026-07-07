import { useState, useEffect } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "../../integrations/trpc/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { Eye, EyeOff, ChevronsUpDown, Check, ExternalLink } from "lucide-react";
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
  const [activeTab, setActiveTab] = useState<string>(PROVIDERS[0].id);
  const [hasSetDefaultTab, setHasSetDefaultTab] = useState(false);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [openModelPopover, setOpenModelPopover] = useState(false);
  const [useCustomModel, setUseCustomModel] = useState(false);
  const [customModelName, setCustomModelName] = useState("");

  const { data: availableModels = [] } = useQuery(trpc.getAvailableModels.queryOptions()) as any;
  const { data: activeConfigs = [] } = useQuery(trpc.getProviderConfigs.queryOptions()) as any;
  const { data: tracingDisabled = false, isLoading: isLoadingTracing } = useQuery(
    trpc.getTracingState.queryOptions(),
  ) as { data: boolean; isLoading: boolean };

  const selectedProvider = PROVIDERS.find((p) => p.id === activeTab) || PROVIDERS[0];
  const hasAnyConfigured = (activeConfigs as any[]).some((c: any) => c.hasKey);

  const saveConfig = useMutation(
    trpc.saveProviderConfig.mutationOptions({
      onSuccess: () => {
        toast.success(`Successfully configured ${selectedProvider.name}`);
        queryClient.invalidateQueries(trpc.getProviderConfigs.queryFilter());
        setApiKey("");
        setShowKey(false);
        setIsConfiguring(true);
      },
      onError: (err) => {
        toast.error(err.message || "Failed to save configuration");
      },
    }),
  );

  const setTracingState = useMutation(
    trpc.setTracingState.mutationOptions({
      onSuccess: () => {
        toast.success("Tracing preference updated");
        queryClient.invalidateQueries(trpc.getTracingState.queryFilter());
      },
      onError: (err) => {
        toast.error(err.message || "Failed to update tracing preference");
      },
    }),
  );

  useEffect(() => {
    if (activeConfigs.length > 0 && !hasSetDefaultTab) {
      const firstActive = PROVIDERS.find((p) => {
        const conf = activeConfigs.find((c: any) => c.provider === p.slug);
        return conf?.hasKey;
      });
      if (firstActive) {
        setActiveTab(firstActive.id);
        setIsConfiguring(true);
      }
      setHasSetDefaultTab(true);
    }
  }, [activeConfigs, hasSetDefaultTab]);

  useEffect(() => {
    if (activeConfigs.length > 0 && hasAnyConfigured) {
      setIsConfiguring(true);
    }
  }, [activeConfigs, hasAnyConfigured]);

  const providerModels = (availableModels as any[]).filter(
    (m) =>
      m.provider === selectedProvider.slug ||
      (selectedProvider.slug === "azure" && m.provider === "openai") ||
      (selectedProvider.slug === "openrouter" &&
        ["google", "openai", "anthropic", "cohere", "mistral"].includes(m.provider)),
  );

  useEffect(() => {
    const existing = (activeConfigs as any[]).find(
      (c: any) => c.provider === selectedProvider.slug,
    );
    const modelId = existing?.modelName || "";
    setApiKey("");
    setShowKey(false);

    const modelsForThisProvider = (availableModels as any[]).filter(
      (m) =>
        m.provider === selectedProvider.slug ||
        (selectedProvider.slug === "azure" && m.provider === "openai") ||
        (selectedProvider.slug === "openrouter" &&
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
  }, [activeTab, activeConfigs, availableModels]);

  const handleSave = () => {
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

  const sortedProviders = [...PROVIDERS].sort((a, b) => {
    const configA = (activeConfigs as any[]).find((c: any) => c.provider === a.slug);
    const configB = (activeConfigs as any[]).find((c: any) => c.provider === b.slug);
    const hasKeyA = configA?.hasKey ? 1 : 0;
    const hasKeyB = configB?.hasKey ? 1 : 0;

    if (hasKeyA !== hasKeyB) {
      return hasKeyB - hasKeyA;
    }

    const indexA = PROVIDERS.findIndex((p) => p.id === a.id);
    const indexB = PROVIDERS.findIndex((p) => p.id === b.id);
    return indexA - indexB;
  });

  return (
    <div className="flex-1 flex flex-col lg:flex-row gap-8 p-8 lg:p-12 max-w-5xl mx-auto w-full animate-fade-in">
      {/* Left panel: Providers List */}
      <div className="w-full lg:w-2/5 flex flex-col gap-4">
        <div className="space-y-1">
          <h1 className="text-xl font-sans font-semibold tracking-tight text-foreground">
            Settings
          </h1>
          <p className="text-muted-foreground text-xs font-sans">
            Configure integration credentials and default models.
          </p>
        </div>

        <div className="flex flex-col gap-1 border border-border/40 rounded-lg p-1.5 bg-card/10">
          {sortedProviders.map((provider) => {
            const providerConfig = (activeConfigs as any[]).find(
              (c: any) => c.provider === provider.slug,
            );
            return (
              <button
                key={provider.id}
                onClick={() => {
                  setActiveTab(provider.id);
                  setIsConfiguring(true);
                }}
                className={cn(
                  "flex items-center justify-between px-3 py-2.5 rounded-md text-left transition-colors cursor-pointer text-xs font-sans",
                  activeTab === provider.id
                    ? "bg-foreground/5 text-foreground font-medium border border-border/30"
                    : "text-muted-foreground hover:bg-foreground/[0.02] hover:text-foreground border border-transparent",
                )}
              >
                <span>{provider.name}</span>
                <div className="flex items-center gap-2">
                  {providerConfig?.modelName && (
                    <span className="text-[10px] font-mono opacity-65 truncate max-w-[80px]">
                      {providerConfig.modelName}
                    </span>
                  )}
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full shrink-0",
                      providerConfig?.hasKey ? "bg-emerald-500" : "bg-zinc-500/80",
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Global preferences */}
        <div className="flex flex-col gap-3 border border-border/40 rounded-lg p-4 bg-card/10">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 max-w-[80%]">
              <span className="text-xs font-sans font-semibold text-foreground">
                Disable Tracing
              </span>
              <p className="text-[10px] text-muted-foreground leading-normal">
                Tracing helps developers debug prompt flows, analyze latency, and diagnose container
                issues.
              </p>
            </div>
            <Switch
              checked={tracingDisabled}
              onCheckedChange={(checked) => setTracingState.mutate(checked)}
              disabled={isLoadingTracing || setTracingState.isPending}
            />
          </div>
        </div>
      </div>

      {/* Right panel: Active Integration Console or Walkthrough Onboarding */}
      {!hasAnyConfigured && !isConfiguring ? (
        <div className="flex-1 border border-border/50 bg-card/20 rounded-xl p-6 flex flex-col justify-between min-h-[380px] animate-fade-in">
          <div className="space-y-5">
            <div className="border-b border-border/20 pb-3">
              <h2 className="text-sm font-sans font-semibold text-foreground">
                Get Started with Tenet
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Connect an integration model provider to run issue solver builds.
              </p>
            </div>

            <div className="space-y-4">
              {/* Step 1 */}
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full border border-border/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 bg-background/50">
                  1
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-foreground">Select LLM Provider</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Choose a provider from the sidebar menu (e.g. OpenAI, Google Gemini, or
                    OpenRouter).
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full border border-border/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 bg-background/50">
                  2
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-foreground">
                    Authenticate & Assign Model
                  </h4>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Enter your API credential token and set the default model to launch container
                    tasks.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-3">
                <div className="h-5 w-5 rounded-full border border-border/50 flex items-center justify-center text-[10px] font-mono text-muted-foreground shrink-0 bg-background/50">
                  3
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs font-medium text-foreground">Trigger Build Commands</h4>
                  <p className="text-[10px] text-muted-foreground leading-normal">
                    Open any issue on GitHub, comment{" "}
                    <code className="px-1 py-0.5 bg-foreground/5 rounded font-mono text-[9px]">
                      /tenet-build
                    </code>{" "}
                    to trigger the solver job.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-border/20">
            <Button
              onClick={() => setIsConfiguring(true)}
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium font-sans h-9 text-xs cursor-pointer transition-colors"
            >
              Configure First Provider
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex-1 border border-border/50 bg-card/20 rounded-xl p-6 flex flex-col gap-5">
          <div className="flex items-baseline justify-between border-b border-border/20 pb-3">
            <h2 className="text-sm font-sans font-semibold text-foreground">
              {selectedProvider.name}
            </h2>
            <a
              href={selectedProvider.docUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-sans text-primary hover:underline flex items-center gap-1 cursor-pointer select-none"
            >
              <span>{selectedProvider.name} API Dashboard</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="flex-1 space-y-4">
            {/* API Key Form Group */}
            <div className="space-y-1.5">
              <Label htmlFor="apiKey" className="text-xs font-sans text-muted-foreground">
                API Key
              </Label>
              <div className="relative">
                <Input
                  id="apiKey"
                  type={showKey ? "text" : "password"}
                  placeholder="Credential token"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="bg-background border-border pr-10 focus-visible:ring-primary/20 font-mono text-xs h-9"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-2.5 top-2.5 text-muted-foreground/60 hover:text-foreground cursor-pointer"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Default Model Selector Form Group */}
            <div className="space-y-2">
              <Label htmlFor="modelSelect" className="text-xs font-sans text-muted-foreground">
                Default Model
              </Label>

              {/* Custom Model Toggle Switch */}
              <div className="flex items-center justify-between border border-border/40 rounded-lg p-2.5 bg-foreground/[0.005]">
                <span className="text-xs font-sans font-medium text-foreground">
                  Custom Model ID
                </span>
                <Switch
                  checked={useCustomModel}
                  onCheckedChange={(checked) => {
                    setUseCustomModel(checked);
                    if (checked) {
                      setCustomModelName(selectedModel);
                      setSelectedModel("");
                    } else {
                      setSelectedModel(customModelName);
                      setCustomModelName("");
                    }
                  }}
                />
              </div>

              {useCustomModel ? (
                <Input
                  placeholder="Model identifier (e.g. gemini-2.5-flash)"
                  value={customModelName}
                  onChange={(e) => setCustomModelName(e.target.value)}
                  className="bg-background border-border focus-visible:ring-primary/20 font-mono text-xs h-9 px-3"
                />
              ) : (
                <Popover open={openModelPopover} onOpenChange={setOpenModelPopover}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openModelPopover}
                      className="w-full justify-between bg-background border-border hover:bg-background/80 text-foreground font-mono text-xs h-9 px-3 cursor-pointer"
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
                  <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-card border-border z-[100] shadow-md">
                    <Command className="bg-transparent">
                      <CommandInput
                        placeholder="Search models..."
                        className="font-mono text-xs border-none focus:ring-0 focus:outline-none h-8"
                      />
                      <CommandList className="max-h-[200px] overflow-y-auto">
                        <CommandEmpty className="py-2 text-center text-xs text-muted-foreground font-sans">
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
                              className="font-mono text-xs cursor-pointer flex flex-col items-start gap-0.5 py-2 px-3 hover:bg-foreground/[0.02] transition-colors"
                            >
                              <div className="flex items-center justify-between w-full">
                                <span className="font-sans font-medium text-foreground text-xs truncate">
                                  {model.name}
                                </span>
                                <Check
                                  className={cn(
                                    "h-3.5 w-3.5 text-primary",
                                    selectedModel === model.id ? "opacity-100" : "opacity-0",
                                  )}
                                />
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate">
                                {model.id}
                              </span>
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border/20">
            <Button
              onClick={handleSave}
              disabled={saveConfig.isPending}
              className="w-full bg-foreground text-background hover:bg-foreground/90 font-medium font-sans h-9 transition-colors cursor-pointer text-xs"
            >
              {saveConfig.isPending ? "Saving..." : "Save Configuration"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
