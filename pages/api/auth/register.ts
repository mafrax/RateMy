import { createApiRoute, validateBody } from '@/src/lib/api-handler'
import { authService } from '@/src/services/auth.service'
import { signUpSchema } from '@/src/lib/validation'
import { SignUpForm } from '@/src/types'

export default createApiRoute({
  POST: validateBody<SignUpForm>(signUpSchema, async (ctx, body) => {
    const result = await authService.signUp(body)
    return result
  })
}, {
  methods: ['POST']
})