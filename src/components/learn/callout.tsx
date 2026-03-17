interface CalloutProps {
  children: React.ReactNode;
}

export function Callout({ children }: CalloutProps) {
  return (
    <div className="my-8 rounded-lg border-l-[3px] border-primary bg-muted/30 px-5 py-4 text-sm leading-relaxed text-muted-foreground [&>strong]:text-foreground">
      {children}
    </div>
  );
}
