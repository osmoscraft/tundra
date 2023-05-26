/* Select a list of files with minimum updatedTime */
SELECT * FROM File WHERE updatedTime >= :minUpdatedTime;