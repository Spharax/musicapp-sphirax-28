import { MelodyForge } from "@/components/MelodyForge";
import { ErrorBoundary } from "@/utils/errorBoundary";

const Index = () => {
  return (
    <ErrorBoundary>
      <MelodyForge />
    </ErrorBoundary>
  );
};

export default Index;
