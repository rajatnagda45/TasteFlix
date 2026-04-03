"use client";

import { initializeApp } from "firebase/app";
import {
  getAuth,
  getRedirectResult,
  GithubAuthProvider,
  GoogleAuthProvider,
  User,
  signInWithPopup,
  signInWithRedirect,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

interface FirebaseAuthResponse {
  idToken: string;
  email: string;
  refreshToken: string;
  expiresIn: string;
  localId: string;
}

function ensureFirebaseKey() {
  if (!firebaseConfig.apiKey) {
    throw new Error("Firebase is not configured. Add the Firebase keys to frontend/.env.local.");
  }
  return firebaseConfig.apiKey;
}

async function firebaseRequest<T>(path: string, payload: Record<string, unknown>): Promise<T> {
  const apiKey = ensureFirebaseKey();
  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/${path}?key=${apiKey}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(parseFirebaseError(data?.error?.message));
  }
  return data as T;
}

function parseFirebaseError(code: string | undefined) {
  switch (code) {
    case "EMAIL_EXISTS":
      return "This email is already registered in Firebase.";
    case "EMAIL_NOT_FOUND":
      return "No Firebase account was found with this email.";
    case "INVALID_PASSWORD":
      return "Incorrect password.";
    case "INVALID_LOGIN_CREDENTIALS":
      return "Invalid email or password.";
    case "WEAK_PASSWORD : Password should be at least 6 characters":
      return "Password should be at least 6 characters.";
    case "TOO_MANY_ATTEMPTS_TRY_LATER":
      return "Too many attempts. Please try again later.";
    default:
      return "Firebase authentication failed.";
  }
}

export async function firebaseSignup(email: string, password: string, fullName: string) {
  const signup = await firebaseRequest<FirebaseAuthResponse>("accounts:signUp", {
    email,
    password,
    returnSecureToken: true,
  });

  if (fullName.trim()) {
    await firebaseRequest("accounts:update", {
      idToken: signup.idToken,
      displayName: fullName.trim(),
      returnSecureToken: false,
    });
  }

  return signup;
}

export async function firebaseLogin(email: string, password: string) {
  return firebaseRequest<FirebaseAuthResponse>("accounts:signInWithPassword", {
    email,
    password,
    returnSecureToken: true,
  });
}

function buildProvider(providerName: "google" | "github") {
  const provider = providerName === "google" ? new GoogleAuthProvider() : new GithubAuthProvider();

  if (providerName === "google") {
    provider.setCustomParameters({ prompt: "select_account" });
  } else {
    provider.addScope("user:email");
  }
  return provider;
}

function normalizeSocialProfile(user: User, providerName: "google" | "github") {
  const email = user.email;
  if (!email) {
    throw new Error("Your Firebase account did not return an email address.");
  }
  return {
    email,
    full_name: user.displayName || email.split("@")[0],
    provider: providerName,
  } as const;
}

export async function firebaseSocialLogin(providerName: "google" | "github") {
  const provider = buildProvider(providerName);

  try {
    const result = await signInWithPopup(auth, provider);
    return normalizeSocialProfile(result.user, providerName);
  } catch (error: unknown) {
    const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      await signInWithRedirect(auth, provider);
      return null;
    }
    if (code === "auth/popup-closed-by-user") {
      throw new Error("The sign-in popup was closed before authentication finished.");
    }
    if (code === "auth/account-exists-with-different-credential") {
      throw new Error("This email already exists with a different sign-in method.");
    }
    if (code === "auth/unauthorized-domain") {
      throw new Error("This domain is not authorized in Firebase. Add localhost to Authorized domains.");
    }
    throw new Error(`${providerName === "google" ? "Google" : "GitHub"} sign-in failed.`);
  }
}

export async function consumeFirebaseSocialRedirect() {
  const result = await getRedirectResult(auth);
  if (!result) {
    return null;
  }

  const providerName = result.providerId === "github.com" ? "github" : "google";
  return normalizeSocialProfile(result.user, providerName);
}
