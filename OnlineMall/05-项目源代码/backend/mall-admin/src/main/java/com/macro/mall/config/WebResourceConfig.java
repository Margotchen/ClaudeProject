package com.macro.mall.config;

import com.macro.mall.controller.MinioController;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.nio.file.Paths;

/**
 * 静态资源映射配置
 * 将本地上传的文件目录映射为 /uploads/** 供前端访问（MinIO 不可用时的本地存储回退）
 */
@Configuration
public class WebResourceConfig implements WebMvcConfigurer {
    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        String uploadPath = Paths.get(MinioController.UPLOAD_DIR).toAbsolutePath().toUri().toString();
        //目录不存在时 toUri() 不带尾斜杠，会导致相对路径解析错误（图片404）
        if (!uploadPath.endsWith("/")) {
            uploadPath += "/";
        }
        registry.addResourceHandler("/uploads/**").addResourceLocations(uploadPath);
    }
}
