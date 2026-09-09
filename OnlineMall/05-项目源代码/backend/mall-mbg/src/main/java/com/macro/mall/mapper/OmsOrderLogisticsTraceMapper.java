package com.macro.mall.mapper;

import com.macro.mall.model.OmsOrderLogisticsTrace;
import org.apache.ibatis.annotations.Insert;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Results;
import org.apache.ibatis.annotations.Result;
import org.apache.ibatis.annotations.Select;

import java.util.List;

public interface OmsOrderLogisticsTraceMapper {

    @Insert("INSERT INTO oms_order_logistics_trace (order_id, content, create_time) VALUES (#{orderId}, #{content}, now())")
    int insert(OmsOrderLogisticsTrace record);

    @Select("SELECT id, order_id, content, create_time FROM oms_order_logistics_trace WHERE order_id = #{orderId} ORDER BY create_time DESC")
    @Results({
        @Result(column = "id", property = "id"),
        @Result(column = "order_id", property = "orderId"),
        @Result(column = "content", property = "content"),
        @Result(column = "create_time", property = "createTime")
    })
    List<OmsOrderLogisticsTrace> selectByOrderId(@Param("orderId") Long orderId);
}
