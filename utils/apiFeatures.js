class apiFeatures {
  constructor(query, queryString) {
    this.query = query;
    this.queryString = queryString; //queryString is object
  }

  //filter sort paginate

  filter() {
    //create filter object out of queryString excluding sort, page, limit or any other special names/operations

    let filter = { ...this.queryString };
    const excludedFileds = ["sort", "page", "limit"];

    excludedFileds.forEach((el) => delete filter[el]);
    // add mongo operators ie. append $

    filter = JSON.parse(
      JSON.stringify(filter).replace(
        /\blte|lt|gt|gte\b/g,
        (match) => `$${match}`
      )
    );

    this.query = this.query.find(filter);

    return this;
  }

  sort() {
    //check if client has requested sorting
    if (!this.queryString.sort) return this;

    let sortCriteria = this.queryString.sort.replace(/,/g, " "); //regex with 'g' to replace all occurrences of "," used in seperating sortBy multiple fields

    this.query.sort(sortCriteria);

    return this;
  }

  paginate() {
    let page = this.queryString.page * 1 || 1;
    let limit = this.queryString.limit * 1 || 10;

    const skip = (page - 1) * limit;

    this.query.skip(skip).limit(limit);
    return this;
  }
}

module.exports = apiFeatures;
