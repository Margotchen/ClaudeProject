package com.macro.mall.mapper;

import com.macro.mall.model.OmsReturnApplyImage;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface OmsReturnApplyImageMapper {

    @Insert("INSERT INTO oms_return_apply_image (apply_id, url, create_time) VALUES (#{applyId}, #{url}, now())")
    int insert(OmsReturnApplyImage record);

    @Select("SELECT id, apply_id, url, create_time FROM oms_return_apply_image WHERE apply_id = #{applyId} ORDER BY id ASC")
    @Results({
        @Result(column = "id", property = "id"),
        @Result(column = "apply_id", property = "applyId"),
        @Result(column = "url", property = "url"),
        @Result(column = "create_time", property = "createTime")
    })
    List<OmsReturnApplyImage> selectByApplyId(@Param("applyId") Long applyId);
}
