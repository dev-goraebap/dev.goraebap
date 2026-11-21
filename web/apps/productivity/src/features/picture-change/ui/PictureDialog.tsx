import { lazy, Suspense, useEffect, useId, useRef, useState, type CSSProperties, type DragEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from 'cn';
import {
  avatarKeys,
  derivedAvatar,
  DRAWN_AVATAR_BACKGROUNDS,
  DRAWN_AVATAR_FACES,
  drawnAvatarIndex,
  drawnAvatarParts,
  drawnAvatarSource,
  useMemberAvatar,
} from '@/shared/lib/avatar';
import { Button } from '@/shared/ui/kit/button';
import { FormDialog } from '@/shared/ui/kit/form-dialog';
import { CheckIcon, RotateCcwIcon, UploadIcon } from '@/shared/ui/kit/icon';
import { PersonAvatar } from '@/shared/ui/kit/person-avatar';
import { Spinner } from '@/shared/ui/kit/spinner';
import { cropPicture, type CropArea } from '../model/crop-picture';
import { openPhoto, PHOTO_ACCEPT } from '../model/photo';
import { savePreset, uploadPicture } from '../api/picture';

// The cropper (react-easy-crop) is only needed once a photo is chosen.
const PictureCropper = lazy(() => import('./PictureCropper').then(module => ({ default: module.PictureCropper })));

const FACES = Array.from({ length: DRAWN_AVATAR_FACES }, (_, index) => index);
const CROP_HEIGHT = 'h-[min(70vw,18rem)]';
const swatchOf = (color: string) => ({ '--swatch': color }) as CSSProperties;

/**
 * 프로필 이미지: 상단 중앙 미리보기에서 사진을 올리거나 기본값으로 되돌리고,
 * 아래에서 캐릭터(3종)와 배경색(6종)을 조합한다. 사진을 고르면 크로퍼 화면으로 전환한다.
 */
export function PictureDialog({ employeeId, name, onClose }: { employeeId: string; name: string; onClose: () => void }) {
  const client = useQueryClient();
  const current = useMemberAvatar(employeeId);
  const fallback = derivedAvatar(employeeId);
  const [draftPreset, setDraftPreset] = useState<number>();
  const [isReset, setIsReset] = useState(false);
  /** The chosen original's object URL, which the cropper reads; let go when another is chosen or the dialog closes. */
  const [photo, setPhoto] = useState<string>();
  const [area, setArea] = useState<CropArea>();
  const [isDragging, setIsDragging] = useState(false);
  const [problem, setProblem] = useState<string>();
  // A photo still opening when another is chosen must not land over it.
  const selection = useRef(0);
  const input = useRef<HTMLInputElement>(null);
  const facesId = useId();
  const colorsId = useId();
  useEffect(() => () => { if (photo) URL.revokeObjectURL(photo); }, [photo]);

  const save = useMutation({
    mutationFn: async () => {
      if (photo && area) return uploadPicture(await cropPicture(photo, area));
      if (isReset) return savePreset();
      if (draftPreset != null) return savePreset(draftPreset);
    },
    onSuccess: () => { void client.invalidateQueries({ queryKey: avatarKeys }); onClose(); },
  });

  const choose = async (file?: File) => {
    if (!file) return;
    const version = ++selection.current;
    try {
      const url = await openPhoto(file);
      if (version !== selection.current) { URL.revokeObjectURL(url); return; }
      setProblem(undefined); save.reset(); setIsReset(false); setDraftPreset(undefined); setArea(undefined); setPhoto(url);
    } catch (error) {
      if (version === selection.current) setProblem(error instanceof Error ? error.message : String(error));
    }
  };

  const pickPreset = (next: number) => {
    selection.current++;
    setProblem(undefined); save.reset(); setPhoto(undefined); setArea(undefined); setIsReset(false); setDraftPreset(next);
  };

  const resetToDefault = () => {
    selection.current++;
    setProblem(undefined); save.reset(); setPhoto(undefined); setArea(undefined); setDraftPreset(undefined); setIsReset(true);
  };

  const cancelPhoto = () => {
    selection.current++;
    setProblem(undefined); save.reset(); setPhoto(undefined); setArea(undefined);
  };

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (!save.isPending) setIsDragging(true);
  };

  const onDragLeave = (event: DragEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsDragging(false);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);
    if (!save.isPending) void choose(event.dataTransfer.files?.[0]);
  };

  const isPresetActive = draftPreset != null || isReset || !current.hasPhoto;
  const activePreset = draftPreset ?? (isReset ? fallback : current.savedPreset ?? fallback);
  const { face: activeFace, background: activeBackground } = drawnAvatarParts(activePreset);
  const shown = draftPreset != null ? drawnAvatarSource(draftPreset) : isReset ? drawnAvatarSource(fallback) : current.picture;
  const isAlreadyDefault = !photo && (isReset || (draftPreset == null && current.isDefault));
  const isSubmitDisabled = photo ? !area : !isReset && draftPreset == null;
  const alert = problem ?? save.error?.message;

  return (
    <FormDialog open onOpenChange={isOpen => { if (!isOpen) onClose(); }} title="프로필 이미지"
      isPending={save.isPending} isSubmitDisabled={isSubmitDisabled} onSubmit={() => save.mutate()}>
      <input ref={input} type="file" hidden aria-hidden tabIndex={-1} accept={PHOTO_ACCEPT}
        onChange={event => { void choose(event.currentTarget.files?.[0]); event.currentTarget.value = ''; }} />

      {photo ? (
        <div className="flex flex-col gap-3">
          <Suspense fallback={<div className={cn('flex items-center justify-center gap-2 rounded-lg bg-muted text-sm text-muted-foreground', CROP_HEIGHT)}>
            <Spinner />사진 편집기를 불러오는 중
          </div>}>
            {/* A new photo starts its place and zoom afresh. */}
            <PictureCropper key={photo} source={photo} isBusy={save.isPending} onArea={setArea} />
          </Suspense>
          <div className="flex items-center justify-between gap-2">
            <Button type="button" variant="secondary" size="sm" disabled={save.isPending} onClick={() => input.current?.click()} className="max-md:h-9">
              <UploadIcon data-icon="inline-start" />다른 사진 고르기
            </Button>
            <Button type="button" variant="ghost" size="sm" disabled={save.isPending} onClick={cancelPhoto} className="max-md:h-9">
              기본 이미지로
            </Button>
          </div>
        </div>
      ) : (
        <>
          <div onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
            className={cn(
              'flex flex-col items-center gap-3 rounded-xl border px-4 py-5 transition-colors',
              isDragging ? 'border-dashed border-primary bg-primary/5' : 'border-transparent bg-muted/40',
            )}>
            <PersonAvatar name={name} picture={shown} className="size-24 ring-1 ring-border/60" />
            <div className="flex items-center gap-2">
              <Button type="button" variant="secondary" size="sm" disabled={save.isPending} onClick={() => input.current?.click()} className="max-md:h-9">
                <UploadIcon data-icon="inline-start" />사진 올리기
              </Button>
              <Button type="button" variant="ghost" size="sm" disabled={save.isPending || isAlreadyDefault} onClick={resetToDefault} className="max-md:h-9">
                <RotateCcwIcon data-icon="inline-start" />기본값으로
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {isDragging ? '여기에 사진을 놓으세요' : 'JPEG, PNG, WebP, GIF · 최대 20MB · 끌어다 놓기 가능'}
            </p>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <span id={facesId} className="text-xs font-medium text-muted-foreground">캐릭터</span>
              <div role="radiogroup" aria-labelledby={facesId} className="grid grid-cols-3 gap-2.5">
                {FACES.map(faceIndex => {
                  const isChosen = isPresetActive && faceIndex === activeFace;
                  const preview = drawnAvatarSource(drawnAvatarIndex(faceIndex, activeBackground));
                  return (
                    <button key={faceIndex} type="button" role="radio" aria-checked={isChosen}
                      aria-label={`캐릭터 ${faceIndex + 1}`} disabled={save.isPending}
                      onClick={() => pickPreset(drawnAvatarIndex(faceIndex, activeBackground))}
                      className={cn(
                        'relative flex items-center justify-center rounded-xl border bg-background p-3 outline-none transition-[border-color,background-color,box-shadow]',
                        'hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                        isChosen ? 'border-foreground ring-1 ring-foreground' : 'border-border',
                      )}>
                      <img src={preview} alt="" className="size-14 rounded-full" />
                      {isChosen ? (
                        <span className="absolute right-2 bottom-2 flex size-5 items-center justify-center rounded-full bg-foreground text-background">
                          <CheckIcon className="size-3.5" />
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span id={colorsId} className="text-xs font-medium text-muted-foreground">배경색</span>
              <div role="radiogroup" aria-labelledby={colorsId} className="flex items-center gap-3 p-0.5">
                {DRAWN_AVATAR_BACKGROUNDS.map((background, colorIndex) => {
                  const isChosen = isPresetActive && colorIndex === activeBackground;
                  return (
                    // check-ui: allow-style 기본 이미지 배경색 견본은 아바타 데이터다.
                    <button key={background.color} type="button" role="radio" aria-checked={isChosen}
                      aria-label={background.name} title={background.name} disabled={save.isPending}
                      onClick={() => pickPreset(drawnAvatarIndex(activeFace, colorIndex))}
                      style={swatchOf(background.color)}
                      className={cn(
                        'size-7 shrink-0 rounded-full bg-(--swatch) outline-none transition-shadow',
                        'focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50',
                        'aria-checked:shadow-[0_0_0_2px_var(--popover),0_0_0_4px_var(--foreground)]',
                        'max-md:size-11 max-md:bg-clip-content max-md:p-2',
                      )} />
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {alert ? <p role="alert" className="text-sm text-destructive">{alert}</p> : null}
    </FormDialog>
  );
}
