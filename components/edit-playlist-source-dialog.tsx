'use client';

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
import {
  useRemovePlaylistSource,
  useUpdatePlaylistSource,
} from '@/data/playlists';

import {
  newPlaylistFormSchema,
  defaultValues,
  type NewPlaylistFormValues,
} from './new-playlist-source-dialog';

export interface EditPlaylistSourceDialogProps {
  source?: NewPlaylistFormValues;
  onOpenChange: DialogProps['onOpenChange'];
}

interface ContentProps {
  onOpenChange: DialogProps['onOpenChange'];
  source?: NewPlaylistFormValues;
}

function Content({ source, onOpenChange }: ContentProps) {
  const { toast } = useToast();
  const form = useForm<NewPlaylistFormValues>({
    resolver: zodResolver(newPlaylistFormSchema),
    defaultValues: {
      ...defaultValues,
      ...source,
    },
    mode: 'onChange',
  });
  const mutation = useUpdatePlaylistSource();
  const deleteMutation = useRemovePlaylistSource();

  const disabled = form.formState.isSubmitting || deleteMutation.isPending;

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
          if (onOpenChange) onOpenChange(false);
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
                disabled={field.disabled || disabled}
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
                  disabled={field.disabled || disabled}
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
                  disabled={field.disabled || disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <DialogFooter>
          <Button
            variant="destructive"
            onClick={async (e) => {
              e.preventDefault();
              if (!source) return;
              try {
                await deleteMutation.mutate(source);
                if (onOpenChange) onOpenChange(false);
              } catch (e) {
                toast({
                  variant: 'destructive',
                  title: 'Uh oh! Something went wrong.',
                  description: (e as Error).toString(),
                });
              }
            }}
            disabled={disabled}
          >
            {deleteMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Delete'
            )}
          </Button>
          <Button type="submit" disabled={disabled}>
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Please wait
              </>
            ) : (
              'Update'
            )}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export function EditPlaylistSourceDialog({
  onOpenChange,
  source,
}: EditPlaylistSourceDialogProps) {
  return (
    <Dialog open={!!source} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit playlist</DialogTitle>
        </DialogHeader>
        <Content source={source} onOpenChange={onOpenChange} />
      </DialogContent>
    </Dialog>
  );
}
