import { getApp, getApps, initializeApp } from "firebase/app";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyBosWkpZZt_GKK-v-LMB1G0oWo_NKGenHk",
  authDomain: "josue-burkhan.firebaseapp.com",
  projectId: "josue-burkhan",
  storageBucket: "josue-burkhan.firebasestorage.app",
  messagingSenderId: "67149413798",
  appId: "1:67149413798:web:7817df383a429e0544a367",
  measurementId: "G-KNJ91FDWGZ",
};

export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

/** Call from a client component when analytics is needed. */
export async function getFirebaseAnalytics(): Promise<Analytics | null> {
  if (typeof window === "undefined" || !(await isSupported())) {
    return null;
  }

  return getAnalytics(firebaseApp);
}
