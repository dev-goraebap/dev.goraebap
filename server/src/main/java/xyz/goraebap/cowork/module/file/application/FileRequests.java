package xyz.goraebap.cowork.module.file.application;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
import xyz.goraebap.cowork.module.file.domain.upload.ImageTraits;
import xyz.goraebap.cowork.module.file.domain.upload.PendingUpload;
import xyz.goraebap.cowork.module.file.domain.upload.UploadPurpose;

public final class FileRequests {
    private FileRequests() {}

    /**
     * A file about to be sent: its name, whose extension decides the format, its exact size in bytes, and what it is
     * for (evidence when left out). A picture may bring what the browser measured: its main colour and its size.
     */
    public record Upload(
            @NotBlank @Size(max = PendingUpload.FILENAME_MAX) String filename,

            @NotNull @Positive Long size,
            UploadPurpose purpose,

            @Pattern(regexp = "^#[0-9a-fA-F]{6}$") @Schema(description = "사진 자리를 칠할 대표색(#RRGGBB)")
            String dominantColor,

            @Positive @Max(ImageTraits.MAX_SIDE) @Schema(description = "사진의 가로(px)")
            Integer width,

            @Positive @Max(ImageTraits.MAX_SIDE) @Schema(description = "사진의 세로(px)")
            Integer height) {
        public Upload {
            purpose = purpose == null ? UploadPurpose.EVIDENCE : purpose;
        }
    }
}
