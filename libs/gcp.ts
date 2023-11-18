import { Storage } from '@google-cloud/storage'
import fs from 'fs'
import Axios from 'axios'
import fsExtra from 'fs-extra'

const bucketName = process.env.GOOGLE_STORAGE_BUCKET_NAME as string;
const storage = new Storage({
	projectId: process.env.GOOGLE_STORAGE_PROJECT_ID,
	scopes: 'https://www.googleapis.com/auth/cloud-platform',
	credentials: {
		client_email: process.env.GOOGLE_STORAGE_EMAIL,
		private_key: process.env.GOOGLE_STORAGE_PRIVATE_KEY,
	},
})

export async function saveCoverToGoogleStorage(imageUrl: string, destFileName: string) {
	await fsExtra.ensureDir(process.cwd() + '/tmp')
	await fsExtra.emptyDir(process.cwd() + '/tmp')

	const filePath = process.cwd() + '/tmp/' + destFileName
	const file = fs.createWriteStream(filePath)

	const response = await Axios({
		url: imageUrl,
		method: 'get',
		responseType: 'stream',
	})

	response.data.pipe(file)

	return new Promise((resolve, reject) => {
		file.on('error', reject)
		file.on('finish', async () => {
			const _response = await storage.bucket(bucketName).upload(filePath, { destination: destFileName })
			resolve({ url: _response[0].publicUrl() })
		})
	})
}