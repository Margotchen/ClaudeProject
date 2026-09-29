package com.edu.platform.controller;

import com.edu.platform.common.BizException;
import com.edu.platform.common.Result;
import com.edu.platform.config.FileProperties;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * 通用文件上传/下载（作业附件等）
 */
@RestController
@RequestMapping("/api/file")
@RequiredArgsConstructor
public class FileController {

    /** 允许的附件扩展名（文档/图片/压缩包） */
    private static final Set<String> ALLOWED_EXT = Set.of(
            "doc", "docx", "pdf", "ppt", "pptx", "xls", "xlsx", "txt", "md",
            "jpg", "jpeg", "png", "gif", "zip", "rar", "7z");

    private final FileProperties fileProperties;

    @PostMapping("/upload")
    public Result<Map<String, String>> upload(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BizException("请选择要上传的文件");
        }
        String original = file.getOriginalFilename();
        if (original == null || original.isBlank()) {
            throw new BizException("文件名不能为空");
        }
        String ext = "";
        int dot = original.lastIndexOf('.');
        if (dot >= 0) {
            ext = original.substring(dot + 1).toLowerCase();
        }
        if (!ALLOWED_EXT.contains(ext)) {
            throw new BizException("不支持的文件类型：" + ext);
        }
        // UUID 重命名，按日期分目录，避免重名与单目录文件过多
        String dirName = java.time.LocalDate.now().toString();
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + ext;
        Path root = Path.of(fileProperties.getUploadDir());
        File dir = root.resolve(dirName).toFile();
        if (!dir.exists() && !dir.mkdirs()) {
            throw new BizException("上传目录创建失败");
        }
        String relativePath = dirName + "/" + storedName;
        try {
            file.transferTo(root.resolve(relativePath).toFile());
        } catch (IOException e) {
            throw new BizException("文件保存失败：" + e.getMessage());
        }
        return Result.success(Map.of("name", original, "path", relativePath));
    }

    @GetMapping("/download")
    public ResponseEntity<Resource> download(@RequestParam("path") String path,
                                             @RequestParam(value = "name", required = false) String name) {
        File file = resolveFile(path);
        String filename = (name == null || name.isBlank()) ? file.getName() : name;
        String encoded = URLEncoder.encode(filename, StandardCharsets.UTF_8).replace("+", "%20");
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encoded)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(new FileSystemResource(file));
    }

    /**
     * 解析相对路径为文件，防路径穿越
     */
    private File resolveFile(String path) {
        if (path == null || path.isBlank() || path.contains("..") || path.contains(":") || path.startsWith("/")) {
            throw new BizException("非法的文件路径");
        }
        Path root = Path.of(fileProperties.getUploadDir()).toAbsolutePath().normalize();
        Path target = root.resolve(path).normalize();
        if (!target.startsWith(root)) {
            throw new BizException("非法的文件路径");
        }
        File file = target.toFile();
        if (!file.exists() || !file.isFile()) {
            throw new BizException("文件不存在");
        }
        return file;
    }
}
