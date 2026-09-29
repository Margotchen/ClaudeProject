package com.edu.platform.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.edu.platform.common.PageResult;
import com.edu.platform.common.Result;
import com.edu.platform.dto.PlaybackQueryDTO;
import com.edu.platform.entity.PlaybackVideo;
import com.edu.platform.service.PlaybackVideoService;
import com.edu.platform.vo.PlaybackVO;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.support.ResourceRegion;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpRange;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.nio.file.Path;
import java.util.List;

/**
 * 课程录播接口
 */
@RestController
@RequestMapping("/api/live/playback")
@RequiredArgsConstructor
public class PlaybackVideoController {

    private final PlaybackVideoService playbackVideoService;

    @GetMapping("/page")
    public Result<PageResult<PlaybackVO>> page(@Valid PlaybackQueryDTO query) {
        Page<PlaybackVO> page = playbackVideoService.pagePlayback(query);
        return Result.success(PageResult.of(page));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> updateStatus(@PathVariable Long id, @RequestParam Integer status) {
        playbackVideoService.updateStatus(id, status);
        return Result.success();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','TEACHER')")
    public Result<Void> delete(@PathVariable Long id) {
        playbackVideoService.deletePlayback(id);
        return Result.success();
    }

    /**
     * 录播文件流（支持 HTTP Range，进度拖拽/倍速）。
     * video 标签无法携带请求头，token 走 query 参数（JwtAuthenticationFilter 已支持）。
     */
    @GetMapping("/file/{id}")
    public ResponseEntity<ResourceRegion> file(@PathVariable Long id,
                                               @RequestHeader HttpHeaders headers) throws IOException {
        PlaybackVideo video = playbackVideoService.getAccessible(id);
        Path path = playbackVideoService.resolveFile(video.getFileName());
        FileSystemResource resource = new FileSystemResource(path);
        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }
        long contentLength = resource.contentLength();
        MediaType mediaType = MediaTypeFactory.getMediaType(resource).orElse(MediaType.APPLICATION_OCTET_STREAM);
        List<HttpRange> ranges = headers.getRange();
        if (ranges.isEmpty()) {
            ResourceRegion region = new ResourceRegion(resource, 0, contentLength);
            return ResponseEntity.ok().contentType(mediaType).body(region);
        }
        HttpRange range = ranges.get(0);
        long start = range.getRangeStart(contentLength);
        long end = range.getRangeEnd(contentLength);
        // 单次最多返回 1MB，浏览器会按需续传
        long rangeLength = Math.min(1024 * 1024, end - start + 1);
        ResourceRegion region = new ResourceRegion(resource, start, rangeLength);
        return ResponseEntity.status(HttpStatus.PARTIAL_CONTENT).contentType(mediaType).body(region);
    }
}
