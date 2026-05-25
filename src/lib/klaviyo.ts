import { ApiKeySession, ProfilesApi } from 'klaviyo-api'

if (!process.env.KLAVIYO_PRIVATE_KEY) {
    console.warn("KLAVIYO_PRIVATE_KEY is not set in environment variables")
}

const session = new ApiKeySession(process.env.KLAVIYO_PRIVATE_KEY || "")
const profilesApi = new ProfilesApi(session)

export const subscribeToNewsletter = async (email: string) => {
    if (!process.env.KLAVIYO_LIST_ID) {
        throw new Error('KLAVIYO_LIST_ID is not set')
    }

    try {
        // We use the subscribeProfiles endpoint which is correct for marketing consent.
        // Spec: https://developers.klaviyo.com/en/reference/subscribe_profiles
        const response = await profilesApi.subscribeProfiles({
            data: {
                type: 'profile-subscription-bulk-create-job',
                attributes: {
                    profiles: {
                        data: [
                            {
                                type: 'profile',
                                attributes: {
                                    email: email,
                                    subscriptions: {
                                        email: {
                                            marketing: {
                                                consent: 'SUBSCRIBED',
                                            },
                                        },
                                    },
                                },
                            },
                        ],
                    },
                },
                relationships: {
                    list: {
                        data: {
                            type: 'list',
                            id: process.env.KLAVIYO_LIST_ID,
                        },
                    },
                },
            },
        })

        return response
    } catch (error: any) {
        // Inspecting errors as per README
        if (error.response) {
            console.error('Klaviyo Error Status:', error.response.status)
            console.error('Klaviyo Error Text:', error.response.statusText)
            console.error('Klaviyo Error Data:', JSON.stringify(error.response.data, null, 2))
        } else {
            console.error('Error subscribing to Klaviyo:', error)
        }
        throw new Error('Failed to subscribe to newsletter')
    }
}
