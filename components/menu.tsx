'use client';
import { useState } from 'react';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from '@/components/ui/menubar';
import Link from 'next/link';
import { NewPlaylistSourceDialog } from './new-playlist-source-dialog';
import { EditPlaylistSourceDialog } from './edit-playlist-source-dialog';

import { usePlaylistSources } from '@/data/playlists';

const Empty = [{ disabled: true, src: '1', name: 'Empty' }];

interface DialogClosed {
  dialog: 'closed';
}

interface DialogAddNewPlaylistSource {
  dialog: 'add-new-playlist-source';
}

interface DialogEditPlaylistSource {
  dialog: 'edit-playlist-source';
  source: any; // TODO:
}

type DialogState =
  | DialogClosed
  | DialogAddNewPlaylistSource
  | DialogEditPlaylistSource;

const NoDialog: DialogClosed = { dialog: 'closed' };

export function Menu() {
  const [dialog, setDialog] = useState<DialogState>(NoDialog);
  const { data: sources } = usePlaylistSources();
  return (
    <>
      <NewPlaylistSourceDialog
        open={dialog.dialog === 'add-new-playlist-source'}
        onOpenChange={() => setDialog(NoDialog)}
      />
      <EditPlaylistSourceDialog
        source={
          dialog.dialog === 'edit-playlist-source' ? dialog.source : undefined
        }
        onOpenChange={() => setDialog(NoDialog)}
      />
      <Menubar className="rounded-none border-b border-none px-2 lg:px-4">
        <MenubarLabel className="font-bold">
          <Link href="/">Media Center</Link>
        </MenubarLabel>
        <MenubarMenu>
          <MenubarTrigger className="relative">Library</MenubarTrigger>
          <MenubarContent>
            <MenubarItem
              onClick={() => setDialog({ dialog: 'add-new-playlist-source' })}
            >
              Add
            </MenubarItem>
            <MenubarSeparator />
            {(sources || Empty).map((src) => (
              <MenubarItem
                key={src.src}
                disabled={'disabled' in src && src.disabled}
                onClick={() =>
                  setDialog({ dialog: 'edit-playlist-source', source: src })
                }
              >
                {src.name}
              </MenubarItem>
            ))}
          </MenubarContent>
        </MenubarMenu>
      </Menubar>
    </>
  );
}
