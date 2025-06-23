"use client";

import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import {
  Authenticated,
  AuthLoading,
  ConvexReactClient,
  Unauthenticated,
} from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ReactNode } from "react";
import { AuthLayout } from "./clerk/AuthLayout";
import { FullScreenLoader } from "./FullScreenLoader";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY!}>
      <ConvexProviderWithClerk useAuth={useAuth} client={convex}>
        <Authenticated>{children}</Authenticated>
        <Unauthenticated>
          <AuthLayout />
        </Unauthenticated>
        <AuthLoading>
          <FullScreenLoader/>
        </AuthLoading>
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}