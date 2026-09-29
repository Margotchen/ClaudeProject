package com.macro.mall.portal;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication(scanBasePackages = "com.macro.mall")
@ComponentScan(basePackages = "com.macro.mall", excludeFilters = {
    @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.macro\\.mall\\.portal\\.controller\\.Member(Attention|ProductCollection|ReadHistory)Controller"),
    @ComponentScan.Filter(type = FilterType.REGEX, pattern = "com\\.macro\\.mall\\.portal\\.service\\.impl\\.Member(Attention|Collection|ReadHistory)ServiceImpl")
})
public class MallPortalApplication {

    public static void main(String[] args) {
        SpringApplication.run(MallPortalApplication.class, args);
    }

}
