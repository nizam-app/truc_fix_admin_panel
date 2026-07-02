import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./components/ui/alert-dialog";
import { Button } from "./components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./components/ui/dialog";
import { Input } from "./components/ui/input";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

export type AdminDialogRow = { label: string; value: string };

export type AdminAlertOptions = {
  title?: string;
  message?: string;
  rows?: AdminDialogRow[];
  body?: string;
};

export type AdminConfirmOptions = {
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
};

export type AdminPromptOptions = {
  title?: string;
  label: string;
  defaultValue?: string;
  description?: string;
  placeholder?: string;
  multiline?: boolean;
  confirmLabel?: string;
  required?: boolean;
};

type DialogState =
  | ({ type: "alert" } & AdminAlertOptions)
  | ({ type: "confirm" } & AdminConfirmOptions)
  | ({ type: "prompt" } & AdminPromptOptions)
  | null;

type Resolver = (value: boolean | string | null | void) => void;

export function linesToDialogRows(lines: string[]): AdminDialogRow[] {
  return lines
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const colon = line.indexOf(":");
      if (colon === -1) {
        return { label: "", value: line };
      }
      return {
        label: line.slice(0, colon).trim(),
        value: line.slice(colon + 1).trim(),
      };
    });
}

function AlertBody({ state }: { state: AdminAlertOptions }) {
  if (state.rows?.length) {
    return (
      <dl className="max-h-[min(60vh,420px)] space-y-3 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm">
        {state.rows.map((row, index) =>
          row.label ? (
            <div
              key={`${row.label}-${index}`}
              className="border-b border-slate-200 pb-2 last:border-0 last:pb-0"
            >
              <dt className="font-medium text-slate-500">{row.label}</dt>
              <dd className="mt-0.5 text-slate-900">{row.value || "—"}</dd>
            </div>
          ) : (
            <div
              key={`line-${index}`}
              className="border-b border-slate-200 pb-2 text-slate-700 last:border-0 last:pb-0"
            >
              {row.value}
            </div>
          )
        )}
      </dl>
    );
  }

  if (state.body) {
    return (
      <pre className="max-h-[min(60vh,420px)] overflow-y-auto whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
        {state.body}
      </pre>
    );
  }

  return null;
}

type AdminDialogContextValue = {
  alert: (options: AdminAlertOptions) => Promise<void>;
  confirm: (options: AdminConfirmOptions) => Promise<boolean>;
  prompt: (options: AdminPromptOptions) => Promise<string | null>;
};

const AdminDialogContext = createContext<AdminDialogContextValue | null>(null);

export function AdminDialogProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DialogState>(null);
  const [promptValue, setPromptValue] = useState("");
  const resolverRef = useRef<Resolver | null>(null);

  const close = useCallback((result: boolean | string | null | void) => {
    const resolve = resolverRef.current;
    resolverRef.current = null;
    setState(null);
    setPromptValue("");
    resolve?.(result);
  }, []);

  const alert = useCallback(
    (options: AdminAlertOptions) =>
      new Promise<void>((resolve) => {
        resolverRef.current = () => resolve();
        setState({ type: "alert", ...options });
      }),
    []
  );

  const confirm = useCallback(
    (options: AdminConfirmOptions) =>
      new Promise<boolean>((resolve) => {
        resolverRef.current = (value) => resolve(Boolean(value));
        setState({ type: "confirm", ...options });
      }),
    []
  );

  const prompt = useCallback(
    (options: AdminPromptOptions) =>
      new Promise<string | null>((resolve) => {
        resolverRef.current = (value) =>
          resolve(typeof value === "string" ? value : null);
        setPromptValue(options.defaultValue ?? "");
        setState({ type: "prompt", ...options });
      }),
    []
  );

  const value = useMemo(
    () => ({ alert, confirm, prompt }),
    [alert, confirm, prompt]
  );

  const isAlert = state?.type === "alert";
  const isConfirm = state?.type === "confirm";
  const isPrompt = state?.type === "prompt";

  return (
    <AdminDialogContext.Provider value={value}>
      {children}

      <Dialog
        open={Boolean(isAlert)}
        onOpenChange={(next) => {
          if (!next) close();
        }}
      >
        {state?.type === "alert" ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{state.title || "Details"}</DialogTitle>
              {state.message ? (
                <DialogDescription>{state.message}</DialogDescription>
              ) : null}
            </DialogHeader>
            <AlertBody state={state} />
            <DialogFooter>
              <Button type="button" onClick={() => close()}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>

      <AlertDialog
        open={Boolean(isConfirm)}
        onOpenChange={(next) => {
          if (!next) close(false);
        }}
      >
        {isConfirm && state ? (
          <AlertDialogContent className="sm:max-w-md">
            <AlertDialogHeader>
              <AlertDialogTitle>{state.title || "Confirm"}</AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-wrap">
                {state.message}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => close(false)}>
                {state.cancelLabel || "Cancel"}
              </AlertDialogCancel>
              <AlertDialogAction
                className={
                  state.destructive
                    ? "bg-red-600 text-white hover:bg-red-700"
                    : undefined
                }
                onClick={() => close(true)}
              >
                {state.confirmLabel || "Continue"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        ) : null}
      </AlertDialog>

      <Dialog
        open={Boolean(isPrompt)}
        onOpenChange={(next) => {
          if (!next) close(null);
        }}
      >
        {state?.type === "prompt" ? (
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{state.title || state.label}</DialogTitle>
              {state.description ? (
                <DialogDescription className="whitespace-pre-wrap">
                  {state.description}
                </DialogDescription>
              ) : null}
            </DialogHeader>
            <PromptForm
              label={state.label}
              multiline={state.multiline}
              placeholder={state.placeholder}
              value={promptValue}
              onChange={setPromptValue}
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => close(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => {
                  const trimmed = promptValue.trim();
                  if (state.required && !trimmed) return;
                  close(trimmed);
                }}
              >
                {state.confirmLabel || "Save"}
              </Button>
            </DialogFooter>
          </DialogContent>
        ) : null}
      </Dialog>
    </AdminDialogContext.Provider>
  );
}

function PromptForm({
  label,
  multiline,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  multiline?: boolean;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const inputId = "admin-dialog-prompt-input";
  return (
    <div className="py-1">
      <Label htmlFor={inputId}>{label}</Label>
      {multiline ? (
        <Textarea
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={5}
          className="mt-1.5 resize-y"
        />
      ) : (
        <Input
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="mt-1.5"
          autoFocus
        />
      )}
    </div>
  );
}

export function useAdminDialog() {
  const ctx = useContext(AdminDialogContext);
  if (!ctx) {
    throw new Error("useAdminDialog must be used within AdminDialogProvider");
  }
  return ctx;
}
