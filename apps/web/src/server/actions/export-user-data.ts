'use server'

import { exportUserData } from '../http/routes/users/export-user-data'

export async function exportUserDataAction() {
  return exportUserData()
}
