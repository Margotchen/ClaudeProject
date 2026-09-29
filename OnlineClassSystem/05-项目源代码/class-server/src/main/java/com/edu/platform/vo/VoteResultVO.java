package com.edu.platform.vo;

import lombok.Data;

import java.util.List;

/**
 * 投票结果视图
 */
@Data
public class VoteResultVO {

    private String voteId;

    private String title;

    private List<String> options;

    /** 各选项得票数，与 options 下标对应 */
    private List<Integer> counts;

    /** 总投票人数 */
    private Integer total;

    /** 是否已结束 */
    private Boolean ended;
}
