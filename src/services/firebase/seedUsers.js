import { auth, db } from './webConfig';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  serverTimestamp 
} from 'firebase/firestore';

export const seedTestUsers = async () => {
  const testUsers = [
    {
      email: 'shipper@test.com',
      password: 'password123',
      userData: {
        businessName: 'Test Shipper Business',
        phone: '1234567890',
        userType: 'shipper',
        displayName: 'Test Shipper',
      }
    },
    {
      email: 'driver@test.com',
      password: 'password123',
      userData: {
        businessName: 'Test Driver Services',
        phone: '0987654321',
        userType: 'driver',
        displayName: 'Test Driver',
        emailVerified: true, // Drivers usually need verification in this app
      }
    }
  ];

  console.log('[Seeding] Starting test user creation...');

  for (const testUser of testUsers) {
    try {
      console.log(`[Seeding] Creating ${testUser.email}...`);
      
      // Try to create the user
      let user;
      try {
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          testUser.email, 
          testUser.password
        );
        user = userCredential.user;
        console.log(`[Seeding] Auth account created for ${testUser.email}`);
      } catch (authError) {
        if (authError.code === 'auth/email-already-in-use') {
          console.log(`[Seeding] User ${testUser.email} already exists in Auth. Signing in to update Firestore...`);
          const userCredential = await signInWithEmailAndPassword(
            auth,
            testUser.email,
            testUser.password
          );
          user = userCredential.user;
        } else {
          throw authError;
        }
      }

      // Update Firestore document
      const userDoc = {
        ...testUser.userData,
        uid: user.uid,
        email: user.email,
        updatedAt: serverTimestamp(),
      };

      // Only add createdAt if it's a new user (or just always overwrite for testing)
      userDoc.createdAt = serverTimestamp();

      await setDoc(doc(db, 'users', user.uid), userDoc, { merge: true });
      console.log(`[Seeding] Firestore document updated for ${testUser.email}`);

    } catch (error) {
      console.error(`[Seeding] Error creating ${testUser.email}:`, error.message);
    }
  }

  // Final cleanup: sign out so the user can log in normally
  await signOut(auth);
  console.log('[Seeding] Test user creation complete. You can now login.');
  return { success: true };
};
