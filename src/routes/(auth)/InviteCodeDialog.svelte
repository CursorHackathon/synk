<script lang="ts">
    import * as Dialog from '$lib/components/ui/dialog'
    import { Input } from '$lib/components/ui/input'
    import { Button } from '$lib/components/ui/button'
    import { Label } from '$lib/components/ui/label'
    import { CheckCircle, XCircle } from 'phosphor-svelte';
    
    let inviteCode = $state('')
    let isValidating = $state(false)
    let validationResult = $state<'valid' | 'invalid' | null>(null)
    let errorMessage = $state('')

    async function validateInvite() {
        isValidating = true
        try {
            const response = await fetch('/api/invite/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: inviteCode })
            })

            if (response.ok) {
                validationResult = 'valid'
                // Allow transition before closing
                setTimeout(() => validationResult = null, 1500)
            } else {
                const error = await response.json()
                validationResult = 'invalid'
                errorMessage = error.message || 'Invalid invite code'
            }
        } catch (err) {
            validationResult = 'invalid'
            errorMessage = 'Failed to validate code'
        } finally {
            isValidating = false
        }
    }
</script>

<Dialog.Root open={!validationResult} >
    <Dialog.Content class="sm:max-w-[425px]">
        <Dialog.Header>
            <Dialog.Title class="text-2xl">Enter Invite Code</Dialog.Title>
        </Dialog.Header>

        <form >
            <div class="grid gap-4 py-4">
                <div class="space-y-2">
                    <Label for="invite-code">Invitation Code</Label>
                    <div class="relative">
                        <Input
                            id="invite-code"
                            bind:value={inviteCode}
                            class="pr-10"
                            placeholder="XXXX-XXXX-XXXX"
                            disabled={isValidating}
                        />
                        {#if validationResult === 'valid'}
                            <CheckCircle class="absolute right-3 top-3 h-5 w-5 text-green-500" />
                        {:else if validationResult === 'invalid'}
                            <XCircle class="absolute right-3 top-3 h-5 w-5 text-red-500" />
                        {/if}
                    </div>
                    {#if validationResult === 'invalid'}
                        <p class="text-sm text-red-500">{errorMessage}</p>
                    {/if}
                </div>

                <Button type="submit" class="w-full" disabled={isValidating} onclick={validateInvite}>
                    {isValidating ? 'Validating...' : 'Continue'}
                </Button>
            </div>
        </form>
    </Dialog.Content>
</Dialog.Root> 