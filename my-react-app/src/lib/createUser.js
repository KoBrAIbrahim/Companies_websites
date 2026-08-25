import { deleteApp, initializeApp } from 'firebase/app'
import { createUserWithEmailAndPassword, getAuth, signOut } from 'firebase/auth'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db, firebaseConfig } from '../firebase'

// Creates a new Firebase Auth account + Firestore profile without signing the
// currently-logged-in admin out. createUserWithEmailAndPassword always signs in as the
// new user on whatever auth instance it runs on, so we run it on a throwaway secondary
// app instance and tear that instance down immediately after, leaving the admin's
// session on the primary auth instance untouched.
export async function createUserAsAdmin({ email, password, name, phone, city, role, percentage, share, currentAdminUid }) {
  const secondaryApp = initializeApp(firebaseConfig, `Secondary-${Date.now()}`)
  const secondaryAuth = getAuth(secondaryApp)
  try {
    const credential = await createUserWithEmailAndPassword(secondaryAuth, email, password)
    await setDoc(doc(db, 'users', credential.user.uid), {
      email,
      name,
      phone,
      city,
      role,
      active: true,
      percentage: role === 'sales' ? Number(percentage) || 0 : null,
      share: role === 'sales' ? (share || '') : null,
      createdAt: serverTimestamp(),
      createdBy: currentAdminUid,
    })
    await signOut(secondaryAuth)
    return credential.user.uid
  } finally {
    await deleteApp(secondaryApp)
  }
}
