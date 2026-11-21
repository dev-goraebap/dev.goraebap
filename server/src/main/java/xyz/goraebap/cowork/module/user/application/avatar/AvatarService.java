package xyz.goraebap.cowork.module.user.application.avatar;

import java.time.Clock;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import xyz.goraebap.cowork.module.file.AttachedFile;
import xyz.goraebap.cowork.module.file.FileFacade;
import xyz.goraebap.cowork.module.user.application.AuthErrorCode;
import xyz.goraebap.cowork.module.user.domain.avatar.Avatar;
import xyz.goraebap.cowork.module.user.domain.avatar.AvatarRepository;
import xyz.goraebap.cowork.module.user.domain.user.UserRepository;
import xyz.goraebap.cowork.shared.error.DomainRuleViolation;
import xyz.goraebap.cowork.shared.web.CurrentUser;

/**
 * Avatars are shown to every member beside names, so anyone signed in may read them; only the member changes theirs.
 */
@Service
@RequiredArgsConstructor
public class AvatarService {
    static final String PICTURE = "EMPLOYEE_AVATAR";

    private final UserRepository userRepository;
    private final AvatarRepository avatarRepository;
    private final AvatarQuery avatarQuery;
    private final FileFacade fileFacade;
    private final Clock clock;

    @Transactional(readOnly = true)
    public List<AvatarViews.AvatarItem> chosen() {
        var chosen = avatarQuery.findAllChosen();
        var withPicture = chosen.stream()
                .filter(item -> item.pictureId() != null)
                .map(AvatarViews.AvatarItem::employeeId)
                .toList();
        // One batch for every picture's colour, read from the file module that measured it.
        Map<UUID, String> colors = new HashMap<>();
        fileFacade.attachmentsOf(PICTURE, withPicture).forEach((employeeId, files) -> files.stream()
                .findFirst()
                .map(AttachedFile::dominantColor)
                .ifPresent(color -> colors.put(employeeId, color)));
        return chosen.stream()
                .map(item -> item.withPictureColor(colors.get(item.employeeId())))
                .toList();
    }

    /**
     * Shows a drawn default, a new picture or the derived default. A new picture replaces the last one; leaving
     * pictures discards the last one.
     */
    @Transactional
    public void change(CurrentUser user, AvatarRequests.AvatarChange request) {
        if (request.preset() != null && request.uploadId() != null)
            throw new DomainRuleViolation("기본 프로필과 사진 중 하나만 고를 수 있습니다");
        if (userRepository.findById(user.id()).isEmpty()) throw AuthErrorCode.AUTH_NOT_FOUND.raise();
        var avatar = avatarRepository.find(user.id());
        if (request.uploadId() != null) {
            var picture =
                    fileFacade.replacePicture(user.id(), request.uploadId(), PICTURE, user.id(), Avatar.PICTURE_SIDE);
            avatar.usePicture(picture.id());
        } else {
            boolean hadPicture = avatar.hasPicture();
            if (request.preset() != null) avatar.choosePreset(request.preset());
            else avatar.reset();
            if (hadPicture) fileFacade.discard(PICTURE, user.id(), user.id());
        }
        avatarRepository.save(avatar, clock.instant());
    }

    /** The member's picture by its id; an earlier picture is gone once replaced. */
    @Transactional(readOnly = true)
    public Optional<FileFacade.OpenedFile> picture(UUID employeeId, UUID pictureId) {
        return fileFacade.open(PICTURE, employeeId, pictureId);
    }
}
