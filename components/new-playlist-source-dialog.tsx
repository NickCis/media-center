'use client';

import { type PropsWithChildren } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { type DialogProps } from '@radix-ui/react-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { useAddPlaylistSource } from '@/data/playlists';

export interface NewPlaylistSourceDialogProps {
  open?: DialogProps['open'];
  onOpenChange?: DialogProps['onOpenChange'];
}

export const newPlaylistFormSchema = z.object({
  type: z.enum(['jsonbin']),
  name: z.string(),
  src: z.string().url({ message: 'Please enter a valid URL.' }),
});

export type NewPlaylistFormValues = z.infer<typeof newPlaylistFormSchema>;
export const defaultValues: Partial<NewPlaylistFormValues> = {
  type: 'jsonbin',
};

function Content() {
  const { toast } = useToast();
  const form = useForm<NewPlaylistFormValues>({
    resolver: zodResolver(newPlaylistFormSchema),
    defaultValues,
    mode: 'onChange',
  });
  const mutation = useAddPlaylistSource();

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(async (values) => {
          try {
            await mutation.mutateAsync(values);
          } catch (e) {
            toast({
              variant: 'destructive',
              title: 'Uh oh! Something went wrong.',
              description: (e as Error).toString(),
            });
          }

          // XXX: hack to close it (this dialog might be used in an uncontrolled fashion)
          const event = new KeyboardEvent('keydown', {
            key: 'Escape',
            code: 'Escape',
            keyCode: 27,
          });
          document.dispatchEvent(event);
        })}
        className="space-y-8"
      >
        <FormField
          control={form.control}
          name="type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Type</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={form.formState.isSubmitting}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select the link type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="jsonbin">JSONBin</SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>
                The link type will affect how the playlist will be fetched.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  disabled={field.disabled || form.formState.isSubmitting}
                />
              </FormControl>
              <FormDescription>
                This will be the name of the playlist.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="src"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Link</FormLabel>
              <FormDescription>The link to the playlist</FormDescription>
              <FormControl>
                <Input
                  {...field}
                  value={field.value || ''}
                  disabled={field.disabled || form.formState.isSubmitting}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Add'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function NewPlaylistSourceDialog({
  open,
  onOpenChange,
  children,
}: PropsWithChildren<NewPlaylistSourceDialogProps>) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {children ? <DialogTrigger asChild>{children}</DialogTrigger> : null}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add playlist</DialogTitle>
        </DialogHeader>
        <Content />
      </DialogContent>
    </Dialog>
  );
}
